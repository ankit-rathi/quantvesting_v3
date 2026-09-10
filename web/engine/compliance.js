export const SHORT_DISCLAIMER = "Quantvesting is not a SEBI-registered Investment Adviser. The information and assessment outputs are provided for educational and informational purposes only and are based on a rules-based analytical framework and data available at the stated time. They are not investment advice or a recommendation to buy, sell or hold any security. Quantvesting does not execute trades or manage client funds. Please make independent investment decisions and consider consulting a SEBI-registered Investment Adviser where appropriate.";
export const FULL_DISCLAIMER = `${SHORT_DISCLAIMER} Market data and analytical inputs may be delayed, incomplete or subject to error. Any historical performance or scenario figures are not indicative of future results.`;
export const CUSTOMER_ACTION_LABELS = {
  BUY_CANDIDATE: "Review candidate",
  EXIT_TARGET: "Target reached — review",
  WAIT_FOR_EXIT_WINDOW: "Legacy holding — review",
  REVIEW_ROTATION: "Rotation review",
  STRONG_ROTATION_REVIEW: "Strong rotation review",
  HOLD: "No current review",
};
export const CUSTOMER_ACTION_REASONS = {
  BUY_CANDIDATE: "A high-ranked item in the configured Quantvesting universe that the framework identifies for review; this is not a buy recommendation.",
  EXIT_TARGET: "Current price has reached or exceeded the configured FTT reference level. Review the underlying evidence before making any decision.",
  WAIT_FOR_EXIT_WINDOW: "This holding is retained as a legacy holding in the framework. Review the underlying evidence when appropriate.",
  REVIEW_ROTATION: "The configured thesis-capture threshold has been reached. Compare the evidence with the available Quantvesting universe.",
  STRONG_ROTATION_REVIEW: "The stronger configured thesis-capture threshold has been reached. Compare the evidence with the available Quantvesting universe.",
  HOLD: "No configured review threshold is currently met.",
};
export const customerActionLabel = action => CUSTOMER_ACTION_LABELS[action] || String(action ?? "");
export const customerActionReason = (action, fallback="") => CUSTOMER_ACTION_REASONS[action] || fallback;
