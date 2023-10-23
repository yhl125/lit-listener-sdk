export interface IThresholdConditionalLogic {
  type: 'THRESHOLD';
  value: number;
}

export interface IEveryConditionalLogic {
  type: 'EVERY';
}

export type IConditionalLogic =
  | IThresholdConditionalLogic
  | IEveryConditionalLogic;
