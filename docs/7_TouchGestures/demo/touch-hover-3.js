(function(){
  //event sequence,
  // startevent touchstart,
  // touchmove,
  // touchend

  //we need to produce the following events that are called
  //
  //touch-hover-enter
  //touch-hover-over
  //touch-hover-leave
  //touch-hover-endSequence
  //click (native, not touch-hover-click)

  //we need to produce pseudo-pseudo-class
  // .touch-hover
  // do we want the .touch-hover on all the ancestors? or only the leaf target?
  // we want it to copy :hover as close as possible, and :hover adds to parents.
  // there are many use-cases where you might want the parent also to be marked.

  //we don't want this to be global, cause it is very heavy.
  //CssControlEvents, but that will be difficult to localize
  //AttributableEvent, which can be localized.
  //But, we want to apply this to individual elements, not
  //

  //early bird
  //replaceDefaultAction?? scroll, click,  we need to re-implement the 'click'
  //AlertBlurCall
})();