export type ElImageFit =
  | EpPropMergeType<
      StringConstructor,
      "" | "fill" | "none" | "contain" | "cover" | "scale-down",
      unknown
    >
  | undefined;

export type ElDatePickerType =
  | "year"
  | "month"
  | "date"
  | "dates"
  | "datetime"
  | "week"
  | "datetimerange"
  | "daterange"
  | "monthrange";

export type ElUploadListType =
  | EpPropMergeType<
      StringConstructor,
      "picture" | "text" | "picture-card",
      unknown
    >
  | undefined;
