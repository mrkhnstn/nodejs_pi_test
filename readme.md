// KNOT TYPES ////////////////////////////////////////////////////////

{
    type: 'number' or 'int'
    value : 50,
    min: 0, (optional)
    max: 100, (optional)
}

// for type number if min and max exist then gui should be slider
// otherwise gui should be a plain number field (maybe increment / decrement)

{
    type: 'string',
    value: 'asdf'
}

{
    type: list
    value: 0-2 // value is a number (0 for first element, 2 for last element)
    list: ['a','b','c'] // labels to be displayed
}

{
    type: button or trigger
    value: 0 // this value will increment by one on each button press, listeners trigger on any change of the value
}

{   //TODO
    type: group
    value: 'title'
}

{   //TODO
    type: json
    value: {a:0,b:1}
}

label: use instead of path name in gui
no_edit: true // if false then make gui non editable //TODO

//////////////////////////////////////////////////////////////////////
// SIMPLIFIED KNOTS ACCESS
/*
 // example: (also see mknots.js)
 // to initialize
 var knots = Knots.singleton();

 // then to access a knot
 var knot = knots.get('path/a/b/c',optional meta parameters)
    .ready(callback)
    .change(callback);

 knot.set(value);
 knot.get(value);

 // to get children map at a path do
 knots.getChildren(path);
 knots.delete(path); //TODO
 knots.setMeta(); //TODO
 */
//////////////////////////////////////////////////////////////////////