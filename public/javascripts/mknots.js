// 
var knots = {}; // map of all knots

// 
var getKnot = function(path){
	if(!(path in knots)){
		knots[path] = new Knot(path,redis);
	}
	return knots[path];
}

var pages = {}; // map of all pages
var getPage = function(path){
	if(!(path in knots)){
		knots[path] = new Knot(path,redis);
	}
	return knots[path];
}

var inited = false;

// setup socket
var socket = io.connect('http://'+window.location.host+'/knots');
var redis = new Redis(socket);
socket.on('connect',function(){
	console.log('socket connected');
});

// Listen for any attempts to call changePage().
$(document).bind( "pagebeforechange", function( e, data ) {
	console.log("pagebeforechange",e,data);
	// We only want to handle changePage() calls where the caller is
	// asking us to load a page by URL.
	
	if(!inited){
		inited = true;
		console.log(data.toPage.context.URL);
		var u = $.mobile.path.parseUrl( data.toPage.context.URL );
		var a = u.pathname.split('/');
		if(a.length >= 2){
			if(a[1] === 'knots'){
				var b = "";
				for(var i=2; i<a.length; i++){
					if(i>2)
						b += '/';
					b += a[i];
				}
				console.log(b);
				getChildren(b,u.domain+u.pathname,data.options);
			}
		}
		return;
	}
	
	if ( typeof data.toPage === "string" ) {
		// We are being asked to load a page by URL, but we only
		// want to handle URLs that request the data for a specific
		// category.
		
		var u = $.mobile.path.parseUrl( data.toPage );
		var a = u.pathname.split('/');
		
		if(a.length >= 2){
			if(a[1] === 'knots'){
				var b = "";
				for(var i=2; i<a.length; i++){
					if(i>2)
						b += '/';
					b += a[i];
				}
				console.log(b);
				getChildren(b,u.domain+u.pathname,data.options);
			}
		}
		
		console.log('parsed url',u,a);
		
		e.preventDefault();
	} else if(typeof data.toPage === 'object'){
		/*
		
		*/
	}
});


$(document).bind( "pageinit", function( e, data ) {
	console.log('pageinit',e,data);
});

$(document).bind( "pagecreate", function( e, data ) {
	console.log('pagecreate',e,data);
});

// add start and stop events to slider
$(document).on({
    "mousedown touchstart": function () {
        $(this).siblings("input").trigger("start");
    },
    "mouseup touchend": function () {
        $(this).siblings("input").trigger("stop");
    }
}, ".ui-slider");

var getChildren = function(path,url,options){
	console.log('getChildren,path,url,options:',url,path,options);

	// if page already exists then display cached page
	if(path in pages){
		console.log('page already exists:',path);
		options.dataUrl = url;
		$.mobile.changePage( pages[path], options );
		return;
	} 

	redis.getChildren(path,function(children){
		console.log('children',children);
		
		var $page = $('<div id="list" data-role="page"></div>').appendTo($('body'));
		pages[path] = $page; // add new page to cached pages
		var $header = $('<div data-role="header"><h1>'+path+'</h1></div>').appendTo($page);
		var $content = $('<div data-role="content"></div>').appendTo($page);
		var $list = $('<ul data-role="listview" data-inset="false"></ul>').appendTo($content);

		for(var n in children){
			var childDef = children[n];
			var $li;
			var childPath = path==''?n:path+"/"+n;
			if(childDef.children){
				
				$li = $('<li><a href="#/knots/'+childPath+'">'+n+'</a></li>').appendTo($list);
			
				
			} else {
				if(_.has(childDef,'type')){
					switch(childDef.type){
						case 'int':
						case 'float':
						case 'number':
							$li = $('<li data-role="fieldcontain"></li>').appendTo($list);
							$li.append('<label for="'+n+'">'+n+'</label>');
							var defaultVal = _.has(childDef,'default') ? childDef.default : 0;
							var min = _.has(childDef,'min') ? childDef.min : 0;
							var max = _.has(childDef,'max') ? childDef.max : 100;
							var $input = $('<input name="'+n+'" id="'+n+'" type="number" data-type="range" value="'+defaultVal+'" min="'+min+'" max="'+max+'" />');
							// can't directly bind to input here because it gets changed by jqm
							$li.append($input);
							
							// get and link to knot
							var knot = getKnot(childPath);
							
							// get initial value
							if(knot.isReady){
								$input.val(knot.get()).slider('refresh');
							} else {
								knot.on('ready',$.proxy(
										function(){
											if(this.input.val() != this.knot.get()){
												this.input.val(this.knot.get()).slider('refresh');
											}
										},
										{ input : $input, knot : knot }
									)
								);
							}

							var o = {
								li : $li,
								input : $input,
								knot : knot,
								fn : $.proxy(function(){
									//console.log('change:',this.input.val());
									if(this.knot.get() != this.input.val()){
										//console.log('changed:',this.input.val());
										this.knot.set(this.input.val());
									}
								},{ input : $input, knot : knot })
							}
							
							$input.on('change',o.fn);
							
							$li.on("start", $.proxy(
								function () { 
									this.input.off('change',this.fn);
									//console.log('start',this.input.val());
								}, o
							));

							$li.on("stop", $.proxy(
								function (event) {
									//var value = event.target.value
									//console.log('stop',this.input.val());
									this.input.on('change',this.fn);
									this.fn();
								}, o
							));
							
							// if knot changes update select
							knot.on('change',$.proxy(
									function(data){
										if(this.val() != data){
											this.val(data).slider('refresh');
										}
									},
									$input
								)
							);
							
							/*
							
							
							
							
							$li.on('change',o.fn);
							*/
							break;
						case 'boolean':
							$li = $('<li data-role="fieldcontain"></li>').appendTo($list);
							$li.append('<label for="'+n+'">'+n+'</label>');
							var $select = $('<select name="'+n+'" id="'+n+'" data-role="slider" value="1"></select>');
							$select.appendTo($li);
							$select.append('<option value="0">Off</option><option value="1">On</option>');

							// get and link to knot
							var knot = getKnot(childPath);
							
							// get initial value
							if(knot.isReady){
								$select.val(knot.get());
							} else {
								knot.on('ready',$.proxy(
										function(){
											if(this.select.val() != this.knot.get()){
												this.select.val(this.knot.get()).slider('refresh');
											}
										},
										{ select : $select, knot : knot }
									)
								);
							}
							
							// if knot changes update select
							knot.on('change',$.proxy(
									function(data){
										if(this.val() != data){
											this.val(data).slider('refresh');
										}
									},
									$select
								)
							);
							
							// if select changes update knot							
							$select.on('change',$.proxy(function(){
								if(this.select.val() != this.knot.get()){
									this.knot.set(this.select.val());
								}
								},
								{ select: $select, knot: knot }
							));
							
							break;
						case 'string':
							$li = $('<li data-role="fieldcontain"></li>').appendTo($list);
							$li.append('<label for="'+n+'">'+n+'</label>');
							var $input = $('<input type="text" name="'+n+'" id="'+n+'" value=""  />');
							$input.appendTo($li);
							$input.change(function(){console.log('text!',this.value)});
							
							// get and link to knot
							var knot = getKnot(childPath);
							
							// get initial value
							if(knot.isReady){
								$input.val(knot.get());
							} else {
								knot.on('ready',$.proxy(
										function(){
											if(this.input.val() != this.knot.get()){
												this.input.val(this.knot.get()).text('refresh');
											}
										},
										{
											input : $input,
											knot : knot
										}
									)
								);
							}
							
							// if knot changes update select
							knot.on('change',$.proxy(
									function(data){
										if(this.val() != data){
											this.val(data).text('refresh');
										}
									},
									$input
								)
							);
							
							// if select changes update knot							
							$input.change($.proxy(function(){
								if(this.input.val() != this.knot.get()){
									this.knot.set(this.input.val());
								}
							},
							{ input: $input, knot: knot }
							));
							
							break;
					}
				} else {
					$li = $('<li>'+n+'</li>').appendTo($list);
				}
			
			}
		}
		
		$page.page();
		$list.trigger('refresh');

		options.dataUrl = url;
		$.mobile.changePage( $page, options );
	
	});
}
