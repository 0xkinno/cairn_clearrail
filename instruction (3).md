# CAIRN CLEARAIL --- FINAL BUILD INSTRUCTION v2.1

## 1. Objective

Transform the existing Cairn product into a Cleanverse-native financial
infrastructure product.

ClearRail connects verified workforce obligations to compliant digital
settlement:

**WORK PROOF → VERIFIED IDENTITY → VERIFIED ASSET → COMPLIANCE → TRAVEL
RULE → SETTLEMENT → RECONCILIATION → PROOF → AUDIT**

Core sentence:

> Cairn doesn't put compliance beside payroll. It makes compliance part
> of the payment itself.

Primary network: **Arbitrum only**\
Primary track: **RWA**\
Secondary track: **Compliant DeFi**

Do not build a landing page, generic payroll app, generic dashboard,
ordinary lending pool, token-transfer demo, KYC screen, or mocked API.

------------------------------------------------------------------------

## 2. Source of truth

Before coding, read:

1.  The complete attached **Cleanverse API V5.6** documentation.
2.  The existing Cairn repository/README.
3.  Existing Cairn WorkProof/Gemini/workforce logic.
4.  Existing business deck.
5.  This instruction.

The official Cleanverse documentation is authoritative. Never invent
endpoints, SDK methods, contract methods, schemas, response fields, or
transaction semantics.

------------------------------------------------------------------------

## 3. Repository / deployment strategy

Create an independent ClearRail copy of the existing Cairn repository.

Keep the original Cairn untouched as the reference project.

ClearRail active deployment target: **Arbitrum only**.

Do not expose NEAR as an active ClearRail network. Do not create
unnecessary multi-chain ambiguity.

Deploy **one canonical ClearRail core protocol contract** on Arbitrum
after full testing.

"One contract" means one ClearRail core deployment. Cleanverse's own
A-Pass, A-Token, AccessCore and Validator infrastructure remains
external and must not be redeployed.

The ClearRail core should cover, where appropriate:

-   payroll batches
-   worker obligations
-   settlement authorization
-   compliance checkpoints
-   RWA payroll-financing obligations
-   capital-provider positions
-   repayment
-   escrow/recovery
-   exposure limits
-   maturity
-   lifecycle state
-   audit anchors
-   pause/emergency controls

Do not deploy repeated replacement contracts.

Before final deployment: - unit tests - integration tests -
invariant/fuzz tests where useful - accounting review - access-control
review - token-flow review - reentrancy review - emergency/pause
review - event coverage review - production build

Record: - contract address - deployment transaction - chain ID - block -
compiler - commit hash - ABI - verified source

------------------------------------------------------------------------

## 4. Cleanverse architecture --- correction

Do **not** use the old assumed "CCP API" architecture.

Use the documented Cleanverse stack:

-   A-Pass / CVI
-   A-Token / CVA
-   Validator Compliance
-   Common Queries
-   Travel Rule
-   optional Fiat Ramp

Cleanverse must sit inside the value-movement path.

------------------------------------------------------------------------

## 5. Dynamic A-Token discovery --- mandatory

Never hard-code USDC, aUSDC, aUSDT, A-Token addresses, AccessCore
addresses or A-Pass addresses.

Use the documented:

`POST /query_deposit_atoken_list`

For ClearRail:

``` json
{
  "chain": "arbitrum"
}
```

Optional filters: - `symbol` - `address`

The response provides: - `origin_token` - `atoken` -
`accesscore_address` - `apass_address`

Token metadata includes: - address - name - symbol - decimals - icon

At runtime: 1. query Arbitrum supported A-Tokens 2. determine the actual
usable settlement asset 3. persist resolved configuration 4. display the
actual asset in the UI 5. fail closed if no supported asset exists

Never represent an ordinary stablecoin as automatically being a
Cleanverse asset.

------------------------------------------------------------------------

## 6. CVI / A-Pass

Use Cleanverse identity for:

-   employer verification
-   worker verification
-   capital-provider verification
-   eligibility
-   credential status
-   expiration
-   revocation
-   tier/sub-tier/group where officially exposed
-   country tags where officially exposed

Documented generation endpoint:

`POST /generate_apass`

Relevant fields: - `customerId` - `expirationTime` - `wallet.address` -
`wallet.chain` - optional `kycSource` - optional `kycId` - optional
`subTier` - optional `subGroup` - optional `identityDataList` - optional
`bankAccountList` - `override`

`customerId` must be at least 12 characters and contain only
A-Z/a-z/0-9.

Arbitrum is supported in the documented wallet chain list.

Country tags derive from `identityDataList[].issuingCountryISO2`.

Use: - `POST /query_apass` - `POST /query_apass_list`

where required for reconciliation/dashboard state.

Do not expose unnecessary PII to the browser.

------------------------------------------------------------------------

## 7. Validator Compliance --- actual documented API

Use the official Validator endpoints.

### Plain JSON reads

-   `POST /validator/is_register`
-   `POST /validator/rules`
-   `POST /validator/verify`
-   `POST /validator/is_paused`

### Encrypted writes

-   `POST /validator/register`
-   `POST /validator/set_rule`
-   `POST /validator/add_rule`
-   `POST /validator/remove_rule`
-   `POST /validator/set_paused`

### Verify

`POST /validator/verify`

``` json
{
  "chain": "arbitrum",
  "contract_address": "<registered ClearRail contract>",
  "user_address": "<wallet>"
}
```

A successful response with `valid: true` means the wallet satisfies the
pool rules.

`valid: false` is a legitimate compliance denial, not an API failure.

If the pool is paused, the API can return `12027`.

The UI/backend must distinguish: - transport/API failure - business
failure - `valid:false` - successful verification

Never convert `valid:false` into success.

------------------------------------------------------------------------

## 8. Validator rules

Use the documented rule object where applicable:

-   `allowed_group`
-   `allowed_sub_group`
-   `min_tier`
-   `min_sub_tier`
-   `is_black_list`
-   `countries`

Country codes use ISO 3166-1 alpha-2.

v5.6 explicitly adds Validator country allow/deny rules.

After a Validator write mutation, wait for the prior transaction to
confirm before issuing another mutation on the same pool.

------------------------------------------------------------------------

## 9. API security / AES

The Cleanverse documentation specifies AES/CBC/PKCS5Padding for
encrypted endpoints.

Exact documented flow:

-   AES
-   CBC
-   PKCS5Padding
-   fixed IV = 16 zero bytes
-   key = Base64-decoded Cleanverse `api-key`
-   UTF-8 JSON
-   Base64 ciphertext
-   encrypted request placed in `data`
-   encrypted responses decoded/decrypted with the same key

The `api-key` is a server secret.

Never expose it in: - frontend code - public environment variables -
browser requests - logs - Git

Create a server-side Cleanverse adapter.

Use `api-id` and `X-Request-ID` where documented.

Handle documented codes including: - `0000` - `0001` - `0002` -
`12026` - `12027` - `RM_001`--`RM_008` - HTTP 400/403/404/409/500

Never assume approval when Cleanverse is unavailable.

------------------------------------------------------------------------

## 10. Transaction reconciliation --- mandatory

Use:

`POST /query_txs`

Required: - `chain` - `address`

Optional: - `symbol` - `startTime` - `endTime` - `txHash` - `type` -
`page` - `pageSize`

Returned transaction data can include: - chain - symbol - tx_hash -
from_address - from_org_name - to_address - amount - fee_amount -
pay_fee_index - type - block_number - block_time - status

After every qualifying ClearRail settlement:

1.  execute the real Arbitrum transaction
2.  obtain the real tx hash
3.  wait for external confirmation
4.  call `/query_txs`
5.  reconcile hash
6.  reconcile amount
7.  reconcile sender
8.  reconcile receiver
9.  reconcile asset
10. reconcile status
11. store proof metadata
12. expose proof in the UI

Never mark payment complete before real confirmation.

------------------------------------------------------------------------

## 11. Travel Rule --- real artifact

Use:

`POST /download_travel_rule`

The documentation supports: - Travel Rule report using the withdraw
transaction hash - Transaction report using transfer hash for
A-Token/Wrapped A-Token transfers

Required: - `txHash` - `wallet.chain` - `wallet.address`

Optional: - `customerId` - `cvRecordId`

Arbitrum is explicitly supported.

Response: - `downloadUrl` - `fileName`

The URL is time-limited.

Audit Center must expose real report status and download action where
available.

Never fabricate a Travel Rule PDF or report.

------------------------------------------------------------------------

## 12. Fiat Ramp --- secondary only

Implement after the hero settlement path is proven.

Documented flow:

**Request Quote → quoteToken → Create Widget URL → present hosted widget
→ Query Order**

Important: - Fiat Ramp uses plain JSON - no AES - use `api-id` - do not
send `orgId` - quoteToken is single-use - quoteToken expires after 15
minutes - quoted pricing is authoritative - do not send client-side
price fields during widget creation - wallet must have a registered,
non-frozen A-Pass on the same chain

Support documented states: - INIT - AWAITING_PAYMENT_FROM_USER -
PAYMENT_DONE_MARKED_BY_USER - PROCESSING -
PENDING_DELIVERY_FROM_TRANSAK - ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK -
COMPLETED - CANCELLED - FAILED - REFUNDED - EXPIRED

Do not allow Fiat Ramp to dilute the main demo.

------------------------------------------------------------------------

## 13. Hero workflow

Build this exact primary journey:

Employer opens ClearRail → creates payroll batch → selects verified
workers → selects approved WorkProof records → calculates compensation →
reviews payroll obligation → verifies employer → verifies workers →
dynamically discovers Cleanverse-supported settlement asset → validates
asset → runs compliance verification → checks Travel Rule readiness →
displays final compliance decision → authorizes settlement → executes
real Arbitrum transaction → waits for confirmation → reconciles with
`/query_txs` → generates Travel Rule/transaction evidence where
supported → shows worker payment proof → creates immutable audit receipt

Visible status chain:

IDENTITY VERIFIED ASSET VERIFIED COMPLIANCE PASSED TRAVEL RULE READY
SETTLEMENT APPROVED PAYMENT EXECUTED PROOF AVAILABLE

Never show PAYMENT SUCCESSFUL before actual chain confirmation.

------------------------------------------------------------------------

## 14. Cairn WorkProof moat

Do not remove existing WorkProof.

Upgrade the intelligence layer to:

**CAIRN WORKPROOF INTELLIGENCE**

Use existing worker activity/check-ins/approved work data for: - payroll
anomaly detection - suspicious hours - duplicate records - unusual
compensation changes - site/work consistency - workforce risk signals -
payroll confidence score

WorkProof answers: "Was the underlying work/obligation credible?"

Cleanverse answers: "Can the value move compliantly?"

AI must never approve financial transactions.

AI = intelligence. Cleanverse = compliance. Deterministic protocol =
settlement authority.

------------------------------------------------------------------------

## 15. RWA --- Payroll Funding Notes

Primary RWA module.

Lifecycle:

`CREATE → VERIFY → ISSUE → FUND → PAYROLL SETTLEMENT → EMPLOYER REPAYMENT → REDEEM/CLOSE`

Model: - issuer identity - payroll obligation - principal - maturity -
repayment amount - funding status - eligible investor class - transfer
restrictions - Cleanverse compliance state - lifecycle state - audit
history

This is a payroll-financing obligation / receivable prototype.

Do not claim a wage itself is a security.

Do not claim legal enforceability without the appropriate legal wrapper.

Cleanverse must materially affect: - issuer eligibility - investor
eligibility - settlement asset - funding - transfer -
repayment/lifecycle controls

------------------------------------------------------------------------

## 16. DeFi --- Verified Payroll Liquidity

Capital providers finance verified payroll obligations.

Rules: - CVI eligibility - compliant CVA settlement asset - compliance
preflight before capital movement - exposure limits - maturity -
utilization - repayment - pause - default handling - emergency
withdrawal - audit trail

Do not create an ordinary permissionless lending pool.

Identity must affect eligibility.

Cleanverse must affect capital movement.

------------------------------------------------------------------------

## 17. Compliance Failure Lab

Mandatory scenarios:

A. Worker credential expires → settlement blocked\
B. Worker revoked → settlement blocked\
C. Recipient fails eligibility → transfer blocked\
D. Settlement asset fails verification → transfer blocked\
E. Compliance/Validator rejects → transaction blocked\
F. Capital provider loses eligibility → new funding blocked\
G. Already-funded obligation fails → protected escrow/recovery

Every failure shows: - exact reason - failed rule - affected
participant - amount - lifecycle state - audit record

Judge moment:

PASS: CVI ✓ CVA ✓ COMPLIANCE ✓ TRAVEL ✓ SETTLE ✓

Then:

CVI ✕ REVOKED COMPLIANCE ✕ BLOCKED ASSET ✕ NOT RELEASED PAYMENT ✕
REJECTED FUNDS ✓ PROTECTED AUDIT ✓ RECORDED

No manual DB edits.

------------------------------------------------------------------------

## 18. Fail-closed architecture

Never:

API unavailable → approve verification unavailable → approve mock result
→ success stale credential → settle unknown asset → settle missing
Travel Rule requirement → settle

Failure becomes: **BLOCK** or **PROTECTED ESCROW / RECOVERY**

according to lifecycle state.

------------------------------------------------------------------------

## 19. Audit Center

Create a premium Audit Center showing:

-   event
-   timestamp
-   actor
-   wallet
-   amount
-   asset
-   Cleanverse decision
-   rule result
-   tx hash
-   block number
-   transaction status
-   WorkProof reference
-   Travel Rule status
-   report filename/download where available
-   lifecycle state

Create a deterministic timeline.

Include:

**Cleanverse Dependency Map**

WORK VERIFIED ↓ CVI / A-PASS ↓ CVA / A-TOKEN ↓ VALIDATOR COMPLIANCE ↓
TRAVEL RULE ↓ ARBITRUM SETTLEMENT ↓ QUERY_TXS RECONCILIATION ↓ PROOF /
AUDIT

------------------------------------------------------------------------

## 20. Architecture

Use:

Frontend → ClearRail application server → Cleanverse adapter → Arbitrum
RPC → ClearRailCore → Cleanverse external infrastructure

Never send secret-bearing Cleanverse calls from the browser.

Create explicit domain modules:

-   workproof
-   payroll
-   compliance
-   settlement
-   rwa
-   liquidity
-   audit
-   cleanverse
-   blockchain
-   security

Use typed domain models and transaction state machines.

Settlement states:

DRAFT → WORK_VERIFIED → IDENTITY_VERIFIED → ASSET_VERIFIED →
COMPLIANCE_CHECKING → COMPLIANCE_APPROVED → SIGNING → BROADCAST →
CONFIRMING → CONFIRMED → RECONCILED → PROOF_READY

Failures must be explicit, not one generic boolean.

------------------------------------------------------------------------

## 21. Contract quality

ClearRailCore must be serious infrastructure.

Use, where applicable: - role separation - reentrancy protection - safe
token handling - checks-effects-interactions - custom errors - events
for major state transitions - deterministic accounting - explicit
authorization - pause/emergency controls - no arbitrary fund-drain
capability - no hidden owner backdoor

The contract does not impersonate Cleanverse contracts.

It consumes official Cleanverse results and enforces ClearRail
settlement conditions.

------------------------------------------------------------------------

## 22. Testing

Unit: - payroll accounting - eligibility - state transitions -
maturity - repayment - escrow - access control - pause - failures

Integration: - Cleanverse authentication - AES handling - A-Token
discovery - Validator verification - transaction reconciliation - Travel
Rule - Arbitrum transaction

Contract: - happy path - revoked worker - expired credential -
ineligible recipient - invalid asset - compliance rejection - funding
limits - repayment - recovery - pause - unauthorized access -
reentrancy-sensitive paths - accounting invariants

End-to-end: run the entire judge demo without manual database changes.

------------------------------------------------------------------------

## 23. No-mocking rule

Never fake: - Cleanverse verification - compliance result - balances -
tx hashes - blockchain confirmation - Travel Rule report - asset
address - A-Token address - audit proof

Sandbox fixtures may exist only when explicitly labelled.

Critical financial paths must use real integration.

If a capability cannot be executed because of environment/credential
limitations, show an explicit unavailable state. Never fabricate
success.

------------------------------------------------------------------------

## 24. Premium UI direction

Retain Cairn's editorial identity.

Design language:

**APPLE CLEAN + EDITORIAL FINTECH + PREMIUM WEB3 INFRASTRUCTURE +
CAIRN**

Keep: - clean typography - editorial serif display typography -
restrained amber/gold - warm off-white - precise black typography -
premium whitespace - dense readable financial tables - subtle borders -
refined shadows - precise status indicators - elegant transaction
timelines

Avoid: - generic Tailwind look - generic SaaS cards - excessive
gradients - neon crypto aesthetics - excessive glassmorphism - cartoon
graphics - generic SVG icon packs - cheap AI UI - excessive animation

Use subtle Framer Motion-style state transitions only.

------------------------------------------------------------------------

## 25. Information architecture

Primary: - Overview - Payroll - Workers - Settlement - RWA - Liquidity -
Compliance Lab - Audit - Verify

Employer: - Overview - Payroll - Workers - Settlement - Funding - Audit

Worker: - Overview - WorkProof - Wages - Payments - Early Access -
Verify

Capital Provider: - Portfolio - Opportunities - Funding - Repayments -
Compliance - Audit

Above fold:

PAYROLL READY

Verified workers Verified obligation Cleanverse compliance Settlement
asset Amount Next action

Primary CTA:

**RUN COMPLIANT PAYROLL**

Judge comprehension target: 20 seconds.

------------------------------------------------------------------------

## 26. Responsive design

Desktop and mobile are production quality.

No: - horizontal overflow - clipped text - overlapping cards - broken
tables - tiny typography - distorted images - overflowing nav - broken
modals - inaccessible controls

Mobile must have deliberate information hierarchy. Do not merely squeeze
desktop into mobile.

------------------------------------------------------------------------

## 27. Visual asset prompts

Generate premium imagery only where it improves the UI.

### HERO

"Photorealistic premium editorial photograph of a verified industrial
workforce operations environment, modern infrastructure project, diverse
professional workers reviewing digital payroll and compliance records,
warm natural daylight, sophisticated neutral palette, subtle amber
accents, cinematic depth, institutional fintech campaign quality, no
logos, no text, no watermark."

### WORKPROOF

"Premium editorial photograph of a professional site supervisor
verifying a worker's approved work record using a secure tablet, modern
industrial site, documentary photography, sophisticated warm neutral
palette, natural light, no logos, no text, no watermark."

### SETTLEMENT

"Abstract premium institutional finance visualization showing verified
work flowing into compliant digital settlement, elegant
physical-to-digital transition, restrained amber and charcoal palette,
editorial financial infrastructure aesthetic, no crypto clichés, no
coins, no text."

### CAPITAL

"Premium institutional finance photograph of professional treasury and
capital markets operators reviewing a verified short-duration financing
portfolio, sophisticated office, warm neutral lighting, cinematic
editorial photography, no logos, no text."

### FAILURE LAB

"Dark premium institutional compliance operations room with a large
financial transaction control interface showing one transaction blocked,
sophisticated amber warning accent, cinematic but restrained, no logos,
no text."

Do not use imagery just to fill empty space.

------------------------------------------------------------------------

## 28. Demo sequence

1.  Employer opens ClearRail.
2.  Creates payroll.
3.  Selects three verified workers.
4.  WorkProof confirms approved work.
5.  CVI/A-Pass state appears.
6.  Actual Arbitrum A-Token is discovered.
7.  CVA/asset state appears.
8.  Validator compliance appears.
9.  Travel Rule readiness appears.
10. Employer settles.
11. Wallet signs.
12. Real Arbitrum transaction executes.
13. Confirmation appears.
14. `/query_txs` reconciles it.
15. Proof appears.
16. Travel Rule/transaction report is requested where supported.
17. Failure Lab opens.
18. Participant is revoked.
19. Second settlement is attempted.
20. Cleanverse denial is shown.
21. ClearRail blocks movement.
22. Protected funds are shown.
23. RWA payroll financing opens.
24. Funding executes.
25. DeFi liquidity opens.
26. Capital-provider eligibility is shown.
27. Repayment executes.
28. Audit evidence is opened/exported.

------------------------------------------------------------------------

## 29. Competitive bar

ClearRail should combine:

ClearFactor → lifecycle compliance\
Mezzanine → financial sophistication\
Pignora → failure/recovery\
Continuity → compliance event becomes financial consequence\
Warden → intelligent automation\
Cairn → WorkProof + workforce intelligence

The moat:

Most projects begin at the financial transaction.

ClearRail begins earlier:

Was the work real? Was the worker verified? Was the employer verified?
Was the obligation approved? Is the money clean? Is the recipient
eligible? Can the payment move compliantly?

Then settle.

------------------------------------------------------------------------

## 30. Positioning

One-line:

> ClearRail is a Cleanverse-native workforce payment and financing rail
> that turns verified work into compliant, auditable value movement.

Short pitch:

> ClearRail connects verified workforce obligations to compliant digital
> settlement. Cairn WorkProof establishes that the underlying work is
> credible; Cleanverse verifies identity, assets and compliance;
> ClearRail enforces the final value movement on Arbitrum and produces
> reconciled transaction and audit proof.

Do not claim regulatory approval, universal compliance, legal
enforceability, or guaranteed hackathon victory.

------------------------------------------------------------------------

## 31. README

Rewrite around:

-   Cairn ClearRail
-   Problem
-   Why workforce payments
-   Why Cleanverse
-   Architecture
-   Cleanverse Dependency Map
-   CVI / A-Pass
-   CVA / A-Token
-   Validator Compliance
-   Transaction reconciliation
-   Travel Rule
-   RWA
-   DeFi
-   WorkProof
-   Security
-   Failure handling
-   Demo
-   Testing
-   Deployment
-   Contract address
-   Transaction proofs
-   Limitations
-   Future institutional integration

State exactly what is live, sandboxed or unavailable.

------------------------------------------------------------------------

## 32. Final completion checklist

-   [ ] Cleanverse V5.6 read
-   [ ] official endpoints used
-   [ ] no invented APIs
-   [ ] API key server-side
-   [ ] AES verified
-   [ ] plain JSON endpoints handled correctly
-   [ ] Arbitrum configured
-   [ ] A-Token discovery dynamic
-   [ ] actual asset displayed
-   [ ] CVI/A-Pass functional
-   [ ] Validator functional
-   [ ] compliance rules understood
-   [ ] query_txs reconciliation functional
-   [ ] Travel Rule path functional where supported
-   [ ] Fiat Ramp isolated as secondary
-   [ ] WorkProof functional
-   [ ] RWA lifecycle functional
-   [ ] DeFi liquidity functional
-   [ ] revocation path functional
-   [ ] protected recovery functional
-   [ ] real Arbitrum transaction executed
-   [ ] external transaction verified
-   [ ] audit trail functional
-   [ ] contract source verified
-   [ ] contract tests pass
-   [ ] integration tests pass
-   [ ] E2E demo passes
-   [ ] no fake critical data
-   [ ] desktop verified
-   [ ] mobile verified
-   [ ] every primary route verified
-   [ ] every transaction state verified
-   [ ] every failure state verified
-   [ ] production build passes
-   [ ] README updated
-   [ ] deployment data recorded

------------------------------------------------------------------------

## 33. Stop conditions

Stop and fix if:

-   an endpoint is guessed
-   Cleanverse result is mocked
-   settlement can bypass compliance
-   ordinary stablecoin is presented as CVA without verification
-   hard-coded A-Token replaces discovery
-   api-key reaches browser
-   fake tx hash appears
-   success appears before confirmation
-   revoked participant can move protected funds
-   invalid participant can fund
-   Travel Rule evidence is fabricated
-   contract has arbitrary fund-drain capability
-   mobile breaks
-   judge cannot understand the product within 20 seconds

If a documented capability cannot safely run with current
credentials/environment, explicitly label it unavailable rather than
fabricate it.

------------------------------------------------------------------------

## 34. Winning standard

The goal is not to make Cairn LOOK like Cleanverse.

The goal is to make Cairn a product that would not work correctly as a
compliant value-movement system without Cleanverse.

Final quality bar:

**REAL WORKFLOW** + **REAL WORKPROOF** + **REAL CLEANVERSE
DEPENDENCY** + **REAL RWA** + **REAL DEFI** + **REAL FAILURE
ENFORCEMENT** + **REAL ARBITRUM SETTLEMENT** + **REAL RECONCILIATION** +
**REAL TRAVEL RULE EVIDENCE** + **REAL AUDITABILITY** + **PREMIUM UX**

Build the infrastructure underneath the interface.
