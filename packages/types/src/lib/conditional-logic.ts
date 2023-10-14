export interface IThresholdConditionalLogic {
  type: 'THRESHOLD';
  value: number;
  interval?: number;
}

export interface ITargetConditionalLogic {
  type: 'TARGET';
  targetCondition: string;
  interval?: number;
}

export interface IEveryConditionalLogic {
  type: 'EVERY';
  interval?: number;
}

export type IConditionalLogic =
  | IThresholdConditionalLogic
  | ITargetConditionalLogic
  | IEveryConditionalLogic;
