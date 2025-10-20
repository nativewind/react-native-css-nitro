# react-native-css-nitro

`rect-native-css` ported to C++ for performance. This is a prototype and not production ready. Ideally this eventually be `react-native-css@4.0.0`

## Description

This library is a port of `react-native-css` to C++ for performance. It will eventually be a drop in replacement for `react-native-css` and they will share the same compiler.

Unlike `react-native-css`, the majority of the processing is done off thread in C++. When styles are updated they are directly applied to the Shadow Tree nodes.

There are two exceptions where styles are applied via a React re-render:

- A non-style prop is changed (e.g `caretColor`)
- The component is animated (the component has a transition or animation style)

## Progress

These are the features that are "done", in that they pass basic testing. More complex testing is needed to ensure they work in all cases.

- [x] Dynamic styles - shadow tree
- [x] Dynamic styles - JS rerender
- [x] Style hot reload - shadow tree
- [x] Style hot reload- JS rerender
- [x] Web
- [x] Multiple style rules
- [x] Specificity sorting
- [x] Pseudo classes
- [x] Media query
- [x] Attribute selectors
- [x] Container named queries
- [x] Container media queries
- [x] Dynamic Variables
- [x] Inline Variables
- [x] Global variables w/ media queries
- [ ] Animations
- [x] Transitions
- [x] Transform
- [ ] Filter
- [x] Important styles
- [x] Important props
- [ ] Safe area units
- [ ] Em & `currentColor`
- [ ] CSS functions (min, max, platform functions, etc)
- [ ] Metro
- [ ] Update compiler to new syntax (switch tuples to objects)
- [ ] Shorthand runtime styles
- [ ] Native component wrappers (e.g TextInput, ScrollView, etc)
- [ ] 3rd party hook (nativeStyleToProp, etc)
- [ ] 3rd party Alt style props (e.g `headerStyle`)
