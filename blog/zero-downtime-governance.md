# Zero downtime is a governance outcome

When people hear that our multi-vendor core-banking migration went live with zero downtime, they usually assume a heroic weekend: war rooms, pizza, someone rolling back a database at 03:00. The truth is less cinematic. By the time go-live arrived, the interesting work had been finished for months — and almost all of it was governance.

## Downtime is a decision that was made too late

Every outage in a complex migration traces back to a decision that was made late, by the wrong people, or not at all: an interface contract that two vendors interpreted differently, a data-quality threshold nobody owned, a rollback criterion invented during the incident it was meant to prevent.

So we treated decision structures as the primary deliverable:

- **Parallel-run scenarios were designed before the technical blueprint was final.** Not as a fallback slide, but as an operated mode with entry criteria, exit criteria, and named owners. If you cannot describe how you will run old and new side by side, you are not migrating — you are gambling.
- **Every vendor boundary got a decision protocol.** Multi-vendor means multi-truth. Interface questions were closed in writing, with a single accountable owner per boundary, before integration testing began.
- **Rollback criteria were written when everyone was calm.** The go/no-go checklist was authored months early, reviewed by risk, and rehearsed. On the night, nobody had to be brave — they had to read.

## The CAB is a system, not a meeting

The same programme digitised the Change Advisory Board, and the two efforts reinforced each other. A CAB that lives in a meeting produces decisions that live in minutes — unsearchable, unauditable, forgettable. A CAB that lives in a system produces decision records: who approved which change, against which risk assessment, with which conditions.

> An audit trail you design upfront costs minutes per change. One you reconstruct afterwards costs weeks per audit.

That record was what let us move fast. Counter-intuitive, but consistent: teams hesitate when accountability is fuzzy. When the decision structure is explicit, saying "yes" gets cheaper.

## What I'd tell a team starting one

1. **Budget as much design time for transition states as for the target state.** The target architecture gets all the diagrams; the in-between states cause all the incidents.
2. **Make "who decides?" a deliverable.** For every foreseeable conflict, name the decider before the conflict exists.
3. **Rehearse the boring path.** Everyone rehearses disaster recovery. Rehearse the normal cutover until it is dull. Dull is the goal.
4. **Let the audit trail be a by-product.** If compliance evidence requires a separate documentation effort, the process is wrong. Evidence should fall out of the workflow.

Zero downtime was not the absence of problems. It was the presence, months earlier, of a structure that turned every problem into a decision someone was already authorised to make.
