# Existing lint findings

The repository had no ESLint setup. After resolving Windows path aliases, the first scan found these existing errors. ESLint bulk suppressions record existing file/rule counts; newly introduced errors still fail. These are not fixed by this visual-only redesign. TypeScript is checked separately. Do not regenerate suppressions to hide new findings.

`json
{
  "react-hooks/immutability": 41,
  "react-hooks/set-state-in-effect": 65,
  "react-hooks/preserve-manual-memoization": 6,
  "react-hooks/refs": 38,
  "react-hooks/purity": 3,
  "react-hooks/rules-of-hooks": 8,
  "react-hooks/static-components": 4,
  "react/no-children-prop": 1,
  "no-undef": 9
}
`
