var inited = false;
var knots = Knots.singleton();
var pages = {}; // map of all pages

$(document).bind("mobileinit", function(){
    $.mobile.touchOverflowEnabled = true;
});

// Listen for any attempts to call changePage().
$(document).bind("pagebeforechange", function (e, data) {
    // We only want to handle changePage() calls where the caller is
    // asking us to load a page by URL.

    if (!inited) {
        inited = true;

        var u = $.mobile.path.parseUrl(data.toPage.context.URL);
        var a = u.pathname.split('/');

        if (a.length >= 2) {
            if (a[1] === 'knots') {
                var b = "";
                for (var i = 2; i < a.length; i++) {
                    if (i > 2)
                        b += '/';
                    b += a[i];
                }
                getChildren(b, u.domain + u.pathname, data.options);
            }
        }
        return;
    }

    if (typeof data.toPage === "string") {

        var u = $.mobile.path.parseUrl(data.toPage);

        if (u.hash == "#edit") {
            //TODO: toggle edit mode
            console.log('toggle edit mode');
            return;
        }

        // load new knots page
        var a = u.pathname.split('/');
        if (a.length >= 2) {
            if (a[1] === 'knots') {
                var b = "";
                for (var i = 2; i < a.length; i++) {
                    if (i > 2)
                        b += '/';
                    b += a[i];
                }
                getChildren(b, u.domain + u.pathname, data.options);
            }
        }

        e.preventDefault();
    } else if (typeof data.toPage === 'object') {
        /*
         */
    }
});


$(document).bind("pageinit", function (e, data) {
    //console.log('pageinit',e,data);
});

$(document).bind("pagecreate", function (e, data) {
    //console.log('pagecreate',e,data);
});

// add start and stop events to slider
$(document).on({
    "mousedown touchstart":function () {
        $(this).siblings("input").trigger("start");
    },
    "mouseup touchend":function () {
        $(this).siblings("input").trigger("stop");
    }
}, ".ui-slider");

var getChildren = function (path, url, options) {
    //console.log('getChildren,path,url,options:',url,path,options);

    // if page already exists then display cached page
    if (path in pages) {
        //console.log('page already exists:',path);
        options.dataUrl = url;
        $.mobile.changePage(pages[path], options);
        return;
    }

    knots.getChildren(path, function (children) {
        //console.log('children',children);

        var $page = $('<div id="list" data-role="page"></div>').appendTo($('body'));
        pages[path] = $page; // add new page to cached pages
        var $header = $('<div data-role="header" data-position="fixed"><a href="#/knots/" data-rel="back" data-icon="back">Back</a><h1>' + path + '</h1></div>').appendTo($page);
        var $content = $('<div data-role="content"></div>').appendTo($page);
        var $footer = $('<div data-role="footer" data-id="ftr" data-position="fixed"><a href="#/knots/" data-rel="home" data-icon="home">Home</a></div>').appendTo($page);
        var $list = $('<ul data-role="listview" data-inset="false"></ul>').appendTo($content);

        for (var n in children) {
            var childDef = children[n];
            var $li;

            var childPath = path == '' ? n : path + "/" + n;
            var label = _.has(childDef,'label') ? childDef.label : n;

            if (childDef.children) {
                $li = $('<li><a href="#/knots/' + childPath + '">' + label + '</a></li>').appendTo($list);
            } else {
                if (_.has(childDef, 'type')) {


                    switch (childDef.type) {
                        case 'int':
                        case 'number':

                            $li = $('<li data-role="fieldcontain"></li>').appendTo($list);
                            $li.append('<label for="' + n + '">' + label + '</label>');
                            var val = _.has(childDef, 'value') ? childDef.value : 0;

                            if (_.has(childDef, 'min') && _.has(childDef, 'max')) {
                                var min = _.has(childDef, 'min') ? childDef.min : 0;
                                var max = _.has(childDef, 'max') ? childDef.max : 100;
                                var $input = $('<input name="' + n + '" id="' + n + '" type="number" data-type="range" value="' + val + '" min="' + min + '" max="' + max + '" />');
                                // can't directly bind to input here because it gets changed by jqm
                                $li.append($input);

                                // get and link to knot
                                var knot = knots.get(childPath);

                                var knotChangedCallback = _.bind(
                                    function () {
                                        if (this.input.val() != this.knot.get()) {
                                            this.input.val(this.knot.get()).slider('refresh');
                                        }
                                    },
                                    { input:$input, knot:knot }
                                );

                                knot.change(knotChangedCallback);

                                var inputChanged = {
                                    li:$li,
                                    input:$input,
                                    knot:knot,
                                    callback:_.bind(function () {
                                        this.knot.set(this.input.val());
                                    }, { input:$input, knot:knot })
                                }

                                $input.on('change', inputChanged.callback);

                                $li.on("start", $.proxy(
                                    function () {
                                        this.input.off('change', this.callback);
                                        //TODO: start update timer
                                    }, inputChanged
                                ));

                                $li.on("stop", $.proxy(
                                    function () {
                                        this.input.on('change', this.callback);
                                        //TODO: stop update timer
                                        this.callback();
                                    }, inputChanged
                                ));
                            } else {
                                // no min / max attributes, use textfield instead
                                // TODO limit input to numbers
                                var $input = $('<input type="text" name="' + n + '" id="' + n + '" value="' + val + '" />');
                                $input.appendTo($li);

                                // get and link to knot
                                var knot = knots.get(childPath);

                                var knotChangedCallback = _.bind(
                                    function () {
                                        if (this.input.val() != this.knot.get()) {
                                            this.input.val(this.knot.get()).text('refresh');
                                        }
                                    }, { input:$input, knot:knot }
                                );

                                knot.change(knotChangedCallback);

                                // if select changes update knot
                                $input.change($.proxy(function () {
                                        var i = parseInt(this.input.val());
                                        if(_.isNumber(i)){
                                            this.knot.set(this.input.val());
                                        }
                                    },
                                    { input:$input, knot:knot }
                                ));
                            }
                            break;
                        case 'button':
                        case 'trigger':
                            $li = $('<li></li>').appendTo($list);

                            $button = $('<button>'+label+'</button>');
                            $li.append($button);

                            var knot = knots.get(childPath);

                            var buttonClicked = _.bind(function(){
                                this.knot.set(this.knot.get()+1);
                            },{knot:knot});

                            $button.on('vclick',buttonClicked);
                            break;
                        case 'boolean':
                            $li = $('<li data-role="fieldcontain"></li>').appendTo($list);
                            $li.append('<label for="' + n + '">' + label + '</label>');
                            var val = _.has(childDef, 'value') ? childDef.value : '0';
                            var $select = $('<select name="' + n + '" id="' + n + '" value="' + val + '" data-role="slider"></select>');
                            $select.appendTo($li);
                            $select.append('<option value="0">Off</option><option value="1">On</option>');

                            // get and link to knot
                            var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function () {
                                    if (this.select.val() != this.knot.get()) {
                                        this.select.val(this.knot.get()).slider('refresh');
                                    }
                                },
                                { select:$select, knot:knot }
                            );

                            knot.ready(knotChangedCallback).change(knotChangedCallback);

                            // if select changes update knot
                            $select.on('change', $.proxy(function () {
                                    this.knot.set(this.select.val());
                                },
                                { select:$select, knot:knot }
                            ));

                            break;
                        case 'list':
                            $li = $('<li data-role="fieldcontain"></li>').appendTo($list);
                            $li.append('<label for="' + n + '">' + label + '</label>');
                            var val = _.has(childDef, 'value') ? childDef.value : '0';
                            var $select = $('<select name="' + n + '" id="' + n + '"></select>');
                            $select.appendTo($li);

                            var defaultVal = _.has(childDef, 'default') ? childDef.default : 0;
                            var list = _.has(childDef, 'list') ? childDef.list : [];

                            for (var i = 0; i < list.length; i++) {
                                $select.append('<option value="' + i + '">' + list[i] + '</option>');
                            }

                            var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function () {
                                    if (this.select.val() != this.knot.get()) {
                                        this.select.val(this.knot.get()).selectmenu('refresh');
                                    }
                                },
                                { select:$select, knot:knot }
                            );

                            knot.ready(knotChangedCallback).change(knotChangedCallback);

                            // if select changes update knot
                            $select.on('change', $.proxy(function () {
                                    this.knot.set(this.select.val());
                                },
                                { select:$select, knot:knot }
                            ));

                            break;
                        case 'string':
                            $li = $('<li data-role="fieldcontain"></li>').appendTo($list);
                            $li.append('<label for="' + n + '">' + label + '</label>');
                            var val = _.has(childDef, 'value') ? childDef.value : '';
                            var $input = $('<input type="text" name="' + n + '" id="' + n + '" value="' + val + '" />');
                            $input.appendTo($li);

                            // get and link to knot
                            var knot = knots.get(childPath);

                            var knotChangedCallback = _.bind(
                                function () {
                                    if (this.input.val() != this.knot.get()) {
                                        this.input.val(this.knot.get()).text('refresh');
                                    }
                                }, { input:$input, knot:knot }
                            );

                            knot.change(knotChangedCallback);

                            // if select changes update knot
                            $input.change($.proxy(function () {
                                    this.knot.set(this.input.val());
                                },
                                { input:$input, knot:knot }
                            ));

                            break;
                    }
                } else {
                    $li = $('<li>' + label + '</li>').appendTo($list);
                }

            }
        }

        $page.page();
        $list.trigger('refresh');

        options.dataUrl = url;
        $.mobile.changePage($page, options);

    });
}
