interface ITimeCondition {
  time_field: string;
  start_time: number;
  end_time: number;
}

export type ITimeConditions = ITimeCondition[];
