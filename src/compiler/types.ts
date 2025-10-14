import type { MediaFeatureNameFor_MediaFeatureId } from "lightningcss";

/********************************    Styles    ********************************/
export interface StyleRule {
  /** Specificity */
  s: SpecificityArray;
  /** Declarations */
  d?: StyleDeclaration[];
  /** Variables */
  v?: VariableDescriptor[];
  /** Named Containers */
  c?: string[];

  /** Declarations use variables */
  dv?: number;

  /**
   * Conditionals
   */

  /** MediaQuery */
  m?: Record<string, [string, string | number]> & { $$op?: "or" | "not" };
  /** PseudoClassesQuery */
  p?: PseudoClassesQuery;
  /** Container Query */
  cq?: ContainerQuery[];
  /** Attribute Conditions */
  aq?: AttributeQuery[];

  /**
   * Animations and Transitions
   */

  /** Animations */
  a?: boolean;
}

export type StyleDeclaration =
  /** This is a static style object */
  | Record<string, StyleDescriptor>
  /** A style that needs to be set  */
  | [StyleDescriptor, string | string[]]
  /** A value that can only be computed at runtime, and only after styles have been calculated */
  | [StyleDescriptor, string | string[], 1];

export type StyleDescriptor =
  | string
  | number
  | boolean
  | undefined
  | StyleFunction
  | StyleDescriptor[];

export type StyleFunction =
  | [
      Record<never, never>,
      string, // string
    ]
  | [
      Record<never, never>,
      string, // string
      StyleDescriptor, // arguments
    ];

/******************************    Media Query    *****************************/

export type MediaCondition =
  // Boolean
  | ["!!", MediaFeatureNameFor_MediaFeatureId]
  // Not
  | ["!", MediaCondition]
  // And
  | ["&", MediaCondition[]]
  // Or
  | ["|", MediaCondition[]]
  // Comparison
  | [
      MediaFeatureComparison,
      MediaFeatureNameFor_MediaFeatureId,
      StyleDescriptor,
    ]
  // [Start, End]
  | [
      "[]",
      MediaFeatureNameFor_MediaFeatureId,
      StyleDescriptor, // Start
      MediaFeatureComparison, // Start comparison
      StyleDescriptor, // End
      MediaFeatureComparison, // End comparison
    ];

export type MediaFeatureComparison = "=" | ">" | ">=" | "<" | "<=";

/*****************************    Pseudo Classes    ***************************/

export interface PseudoClassesQuery {
  /** Hover */
  h?: 1;
  /** Active */
  a?: 1;
  /** Focus */
  f?: 1;
}

/******************************    Variables    *******************************/

export type VariableDescriptor = [string, StyleDescriptor];

/***************************    Attribute Query    ****************************/

type AttributeQueryType =
  | "a" // Attribute
  | "d"; // Data-Attribute

export type AttributeQuery =
  | [AttributeQueryType, string] // Exists
  | [AttributeQueryType, string, "!"] // Falsy
  | [AttributeQueryType, string, AttrSelectorOperator, string] // Use operator
  | [AttributeQueryType, string, AttrSelectorOperator, string, "i" | "s"]; // Case sensitivity

export type AttrSelectorOperator = "=" | "~=" | "|=" | "^=" | "$=" | "*=";

/******************************    Containers    *****************************/

export interface ContainerQuery {
  /** Name */
  n?: string | null;
  m?: MediaCondition;
  p?: PseudoClassesQuery;
  a?: AttributeQuery[];
}

/******************************    Specificity    *****************************/

/**
 * https://drafts.csswg.org/selectors/#specificity-rules
 *
 * This array is sorted by most common values when parsing a StyleSheet
 */
export type SpecificityArray = SpecificityValue[];
export type SpecificityValue = number | undefined;
