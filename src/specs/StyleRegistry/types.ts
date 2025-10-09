export type ViewHandle = {
  props?: Record<string, unknown>;
  constructor?: { name?: string };
  __internalInstanceHandle?: {
    stateNode?: StateNode;
    elementType?: string;
  };
  getScrollResponder?: () => {
    getNativeScrollRef?: () => {
      __internalInstanceHandle?: {
        stateNode?: StateNode;
      };
    };
  };
  getNativeScrollRef?: () => {
    __internalInstanceHandle?: {
      stateNode?: StateNode;
    };
  };
  _viewRef?: {
    __internalInstanceHandle?: {
      stateNode?: StateNode;
    };
  };
  viewRef?: {
    current?: {
      __internalInstanceHandle?: {
        stateNode?: StateNode;
      };
    };
  };
  _nativeRef?: {
    __internalInstanceHandle?: {
      stateNode?: StateNode;
    };
  };
};

type StateNode = {
  node?: ShadowNode;
};

export type ShadowNode = {
  __hostObjectShadowNodeWrapper: any;
};
