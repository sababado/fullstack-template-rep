# Decision records

A decision record captures a choice that future contributors (people and agents) must
respect, with the reasoning, so it isn't reversed by accident.

**Write one when** someone would otherwise make a wrong call in code: a technology
choice, a security or data rule, a boundary between parts of the system. Market
research and product strategy don't belong here.

## Rules

- Copy [0000-template.md](0000-template.md) to `NNNN-short-title.md` with the next number.
- Records are append-only. To change a decision, write a new record that supersedes the
  old one, and set the old one's status to `Superseded by NNNN`.
- The **invariants** are the load-bearing part: numbered, testable statements. Agents
  check changes against them.
- One numbering sequence for the whole repository.

## Index

| Record | Title | Status |
| --- | --- | --- |
| [0001](0001-stack-choices.md) | Stack choices made by the template | Accepted |
