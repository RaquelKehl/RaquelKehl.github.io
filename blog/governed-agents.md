# Agentic AI in regulated organisations: govern the loop, not just the model

Most AI governance conversations I sit in still orbit the model: which one, hosted where, trained on what, hallucinating how often. Those are necessary questions. But when I assess agentic use cases against our governance framework, the model is rarely where the real exposure sits.

An agent is a loop: it perceives, decides, acts through tools, remembers, and sometimes delegates to other agents. Every arrow in that loop is a control point that model-level governance never sees.

## Where the actual risk lives

**Tools.** The moment an agent can call a tool — query a database, send an email, file a ticket — you have granted it an entitlement. Regulated organisations have spent decades learning to manage human entitlements: joiner-mover-leaver, least privilege, recertification. Agent entitlements need the same lifecycle, and today most frameworks don't even have a register for them.

**Memory.** Persistent agent memory is a data store with an unusual property: it was written by a system that can be socially engineered. What enters memory, how long it lives, and whether it can carry information across contexts are retention and confidentiality questions — GDPR-shaped questions — not prompt-engineering details.

**Delegation.** Multi-agent systems route work between agents with different capabilities. That routing is an approval chain. If an agent can decompose a task and hand the sensitive part to a colleague-agent with broader access, you have built privilege escalation into the architecture. Delegation paths need the same scrutiny as any segregation-of-duties design.

**The humans around the loop.** The EU AI Act's human-oversight requirement is easy to satisfy on paper and hard to satisfy honestly. A human who approves forty agent outputs an hour is not oversight; that is a rubber stamp with a pulse. Oversight design is workload design.

## What transfers from classic GRC

The good news: almost everything. When we built our AI governance framework on the EU AI Act, NIST AI RMF and ISO/IEC 42001, the most useful move was refusing to treat AI as exotic. An agent use case enters the same pipeline as any material change: risk assessment, control mapping, documentation, approval, monitoring, audit trail.

> Governance that lives in a separate "AI policy" document will lose to governance embedded in the change process people already follow.

Three practices that have earned their place:

- **A use-case inventory with risk tiers.** Not every agent needs the full apparatus. A RAG assistant that drafts internal summaries is not an agent that executes payments. Tiering keeps the framework credible.
- **Evaluation before entitlement.** An agent earns tool access by passing evals for the specific failure modes that tool enables — the way an employee earns system access through training and role, not enthusiasm.
- **Logs designed for the auditor, not the developer.** Developer traces answer "why did it break?" Audit logs answer "who decided, on what basis, with what authority?" They are different artefacts; you need both.

## The uncomfortable part

The organisations best positioned to benefit from agentic AI are exactly the ones that cannot afford to improvise: banks, insurers, medtech, critical infrastructure. Waiting is not the safe option, because the capability gap compounds. The safe option is building the governance muscle now, on low-tier use cases, so the framework is proven before the high-value ones arrive.

Govern the loop. The model is the easy part.
