import type { Wiki } from '@bgm38/wiki';

import { DATE } from '@app/lib/utils/date.ts';
import { getSubjectPlatformSortKeys } from '@app/vendor';

import type { SubjectType } from './type';

export function extractDate(w: Wiki, typeID: SubjectType, platform: number): DATE {
  const keys = getSubjectPlatformSortKeys(typeID, platform);

  const values = keys
    .map((key) => {
      return w.data.find((v) => v.key === key);
    })
    .filter((v) => v !== undefined);

  for (const item of values) {
    if (!item) {
      continue;
    }
    if (item.value) {
      const parsed = extractFromString(item.value);
      if (parsed) {
        return parsed;
      }
    }

    for (const value of item.values ?? []) {
      if (value.v) {
        const parsed = extractFromString(value.v);
        if (parsed) {
          return parsed;
        }
      }
    }
  }

  return new DATE(0, 0, 0);
}

export function extractFromString(s: string): DATE | undefined {
  let year, month, day;

  for (const pattern of simple_patterns) {
    const m = pattern[Symbol.match](s);
    if (m?.groups) {
      year = m.groups.year;
      month = m.groups.month;
      day = m.groups.day;
    }
  }

  if (!year) {
    return;
  }

  return new DATE(
    Number.parseInt(year),
    month ? Number.parseInt(month) : 0,
    day ? Number.parseInt(day) : 0,
  );
}

const simple_patterns = [
  /((?<year>\d{4})年(?<month>\d{1,2})月(?<day>\d{1,2})日)([^\d号発號]|$)/,
  /(^[^\d-])(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})\)([^\d-]|$)/,
  /(^[^\d/])(?<year>\d{4})\/(?<month>\d{1,2})\/(?<day>\d{1,2})\)([^\d/]|$)/,
  /(^[^\d.])(?<year>\d{4})\.(?<month>\d{1,2})\.(?<day>\d{1,2})\)([^\d.万]|$)/,

  /\((?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})\)$/, // (YYYY-MM-DD)
  /（(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})）$/, //（YYYY-MM-DD）
  /^(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})$/, // YYYY-MM-DD"
  /^(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})[ ([（].*$/, // YYYY-MM-DD...
  /^(?<year>\d{4})年(?:(?<month>\d{1,2})月)?(?:(?<day>\d{1,2})日)?/, // YYYY年(MM月)?(DD日)?
];

const simple_dash_patterns = [
  new RegExp(String.raw`(^|[^\d])\d{4}-\d{2}-\d{2}$`), // YYYY-MM-DD"
  new RegExp(String.raw`^\d{4}-\d{2}-\d{2}([^\d]|[ (（]|$)`), // YYYY-MM-DD ***
  new RegExp(String.raw`\(\d{4}-\d{2}-\d{2}\)$`), // (YYYY-MM-DD)
  new RegExp(String.raw`（\d{4}-\d{2}-\d{2}）$`), // （YYYY-MM-DD）
];
