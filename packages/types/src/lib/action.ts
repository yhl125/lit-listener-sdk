export interface IAction {
  type: string;
  priority: number;
}

export interface FetchAction extends IAction {
  /**
   * The type of the action, always "fetch" for this interface.
   */
  type: 'fetch';
  /**
   * A numerical value representing the priority of the action. The lower the value, the higher the priority.
   */
  priority: number;
  /**
   * The base URL of the API endpoint.
   */
  baseUrl: string;
  /**
   * The specific endpoint to fetch.
   */
  endpoint: string;
  /**
   * The path to access the expected value in the response body.
   */
  responsePath: string;
  /**
   * Optional API key for authorization.
   */
  apiKey?: string;
  /**
   * Optional data to sign. If left blank the returned response will be signed.
   */
  toSign?: Uint8Array;
  /**
   * The condition under which to sign the data.
   */
  signCondition?: {
    type: '&&' | '||';
    operator: '<' | '>' | '==' | '===' | '!==' | '!=' | '>=' | '<=';
    value:
      | number
      | string
      | bigint
      | string[]
      | number[]
      | bigint[]
      | undefined
      | (string | number | bigint)[];
  }[];
}
