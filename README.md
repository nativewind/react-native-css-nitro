# react-native-css-nitro

`rect-native-css` ported to C++ for performance. This is a prototype and not production ready. Ideally this eventually be `react-native-css@4.0.0`

## Description

This library is a port of `react-native-css` to C++ for performance. It will eventually be a drop in replacement for `react-native-css` and they will share the same compiler.

Unlike `react-native-css`, the majority of the processing is done off thread in C++. When styles are updated they are directly applied to the Shadow Tree nodes.

There are two exceptions where styles are applied via a React re-render:

- A non-style prop is changed (e.g `caretColor`)
- The component is animated (the component has a transition or animation style)

## Progress

These are the features that are "done". Only basic testing as been performed.

- [x] Dynamic styles - shadow tree
- [x] Dynamic styles - JS rerender
- [x] Style hot reload - shadow tree
- [x] Style hot reload- JS rerender
- [x] Web
- [x] Multiple style rules
- [x] Specificity sorting
- [x] Transform
- [ ] Filter
- [x] Pseudo classes
- [x] Media query
- [ ] Attribute selectors
- [x] Container named queries
- [x] Container media queries
- [ ] Container attribute queries
- [x] Dynamic Variables
- [x] Global variables w/ media queries
- [ ] CSS functions (min max etc)
- [ ] Style target prop
- [ ] Metro
- [ ] Update compiler to new syntax
- [x] Upgrading elements
- [ ] Upgrading elements warning
- [ ] Animations
- [x] Transitions
- [ ] Important styles
- [ ] Important props
- [ ] Shorthand runtime styles
- [ ] Native component wrappers
- [ ] 3rd party hook (nativeStyleToProp, etc)
