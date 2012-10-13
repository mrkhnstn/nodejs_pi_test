var inited = false;
var knots = Knots.singleton();
var pages = {}; // map of all pages

// Listen for any attempts to call changePage().
$(document).bind( "pagebeforechange", function( e, data ) {
	// We only want to handle changePage() calls where the caller is
	// asking us to load a page by URL.
	
	if(!inited){
		inited = true;

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
				getChildren(b,u.domain+u.pathname,data.options);
			}
		}
		return;
	}
	
	if ( typeof data.toPage === "string" ) {
		
		var u = $.mobile.path.parseUrl( data.toPage );

        console.log(u);
        if(u.hash == "#edit"){
            //TODO: toggle edit mode
            console.log('toggle edit mode');
            return;
        }

        // load new knots page
        var a = u.pathname.split('/');
		if(a.length >= 2){
			if(a[1] === 'knots'){
				var b = "";
				for(var i=2; i<a.length; i++){
					if(i>2)
						b += '/';
					b += a[i];
				}
				getChildren(b,u.domain+u.pathname,data.options);
			}
		}

		e.preventDefault();
	} else if(typeof data.toPage === 'object'){
		/*
		*/
	}
});


$(document).bind( "pageinit", function( e, data ) {
	//console.log('pageinit',e,data);
});

$(document).bind( "pagecreate", function( e, data ) {
	//console.log('pagecreate',e,data);
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
	//console.log('getChildren,path,url,options:',url,path,options);

	// if page already exists then display cached page
	if(path in pages){
		//console.log('page already exists:',path);
		options.dataUrl = url;
		$.mobile.changePage( pages[path], options );
		return;
	} 

	knots.redis.getChildren(path,function(children){
		//console.log('children',children);
		
		var $page = $('<div id="list" data-role="page"></div>').appendTo($('body'));
		pages[path] = $page; // add new page to cached pages
		var $header = $('<div data-role="header"><a href="index.html" data-rel="back" data-icon="back">Back</a><h1>'+path+'</h1><a href="#edit" data-icon="edit">Edit</a></div>').appendTo($page);
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
                            //$li.append('<a href="#delete" data-iconpos="notext" data-role="button" data-icon="delete" data-mini="true" data-inline="true"></a>');
							$li.append('<label for="'+n+'">'+n+'</label>');
							var defaultVal = _.has(childDef,'default') ? childDef.default : 0;
							var min = _.has(childDef,'min') ? childDef.min : 0;
							var max = _.has(childDef,'max') ? childDef.max : 100;
							var $input = $('<input name="'+n+'" id="'+n+'" type="number" data-type="range" value="'+defaultVal+'" min="'+min+'" max="'+max+'" />');
							// can't directly bind to input here because it gets changed by jqm
							$li.append($input);
							
							// get and link to knot
							var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function(){
                                    if(this.input.val() != this.knot.get()){
                                        this.input.val(this.knot.get()).slider('refresh');
                                    }
                                },
                                { input : $input, knot : knot }
                            );

                            knot
                                .ready(knotChangedCallback)
                                .change(knotChangedCallback);

							var inputChanged = {
								li : $li,
								input : $input,
								knot : knot,
								callback : _.bind(function(){
									this.knot.set(this.input.val());
								},{ input : $input, knot : knot })
							}

							$input.on('change',inputChanged.callback);
							
							$li.on("start", $.proxy(
								function () { 
									this.input.off('change',this.callback);
									//TODO: start update timer
								}, inputChanged
							));

							$li.on("stop", $.proxy(
								function () {
									this.input.on('change',this.callback);
									//TODO: stop update timer
									this.callback();
								}, inputChanged
							));

							break;
						case 'boolean':
							$li = $('<li></li>').appendTo($list);
                            var $div = $('<div data-icon="home" data-role="fieldcontain"></div>').appendTo($li);
                            $div.append('<label for="'+n+'">'+n+'</label>');
							var $select = $('<select name="'+n+'" id="'+n+'" data-role="slider" value="1"></select>');
							$select.appendTo($div);
							$select.append('<option value="0">Off</option><option value="1">On</option>');

							// get and link to knot
							var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function(){
                                    if(this.select.val() != this.knot.get()){
                                        this.select.val(this.knot.get()).slider('refresh');
                                    }
                                },
                                { select : $select, knot : knot }
                            );

                            knot
                                .ready(knotChangedCallback)
                                .change(knotChangedCallback);

							// if select changes update knot							
							$select.on('change',$.proxy(function(){
									this.knot.set(this.select.val());
								},
								{ select: $select, knot: knot }
							));
							
							break;
						case 'list':
							$li = $('<li data-role="fieldcontain"></li>').appendTo($list);
							$li.append('<label for="'+n+'">'+n+'</label>');
							var $select = $('<select name="'+n+'" id="'+n+'"></select>');
							$select.appendTo($li);
							
							var defaultVal = _.has(childDef,'default') ? childDef.default : 0;
							var list = _.has(childDef,'list') ? childDef.list : [];
							
							for(var i=0; i<list.length; i++){
								$select.append('<option value="'+i+'">'+list[i]+'</option>');
							}

							var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function(){
                                    if(this.select.val() != this.knot.get()){
                                        this.select.val(this.knot.get()).selectmenu('refresh');
                                    }
                                },
                                { select : $select, knot : knot }
                            );

                            knot
                                .ready(knotChangedCallback)
                                .change(knotChangedCallback);

							// if select changes update knot							
							$select.on('change',$.proxy(function(){
									this.knot.set(this.select.val());
								},
								{ select: $select, knot: knot }
							));
							
							break;
						case 'string':
							$li = $('<li data-role="fieldcontain"></li>').appendTo($list);
							$li.append('<label for="'+n+'">'+n+'</label>');
							var $input = $('<input type="text" name="'+n+'" id="'+n+'" value=""  />');
							$input.appendTo($li);
							
							// get and link to knot
							var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function(){
                                    if(this.input.val() != this.knot.get()){
                                        this.input.val(this.knot.get()).text('refresh');
                                    }
                                },{ input : $input, knot : knot }
                            );

                            knot
                                .ready(knotChangedCallback)
                                .change(knotChangedCallback);

							// if select changes update knot							
							$input.change($.proxy(function(){
									this.knot.set(this.input.val());
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
