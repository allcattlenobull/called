export type ResearchStatus = 'Evidence-backed construct' | 'Evidence-informed method' | 'Descriptive source' | 'Called-specific evidence missing';

export interface ResearchSource {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  method: string;
  relevance: string;
}

export interface ResearchAudit {
  id: string;
  area: string;
  current: string;
  status: ResearchStatus;
  evidence: string;
  limit: string;
  next: string;
  sources: string[];
}

export type InstrumentCandidateStatus = 'Best open candidate' | 'Requires permission or registration' | 'Not suitable for production' | 'Adjacent, not aptitude';

export interface InstrumentCandidate {
  id: string;
  name: string;
  construct: string;
  evidence: string;
  administration: string;
  rights: string;
  decision: string;
  status: InstrumentCandidateStatus;
  links: { label: string; url: string }[];
}

/** Sources are linked to the method they support, not used as borrowed validation. */
export const RESEARCH_SOURCES: ResearchSource[] = [
  {
    id: 'icar-initial-validation',
    title: 'The International Cognitive Ability Resource: Development and initial validation of a public-domain measure',
    authors: 'Condon & Revelle',
    venue: 'Intelligence',
    year: 2014,
    url: 'https://doi.org/10.1016/j.intell.2014.01.004',
    method: 'Development and initial psychometric validation of the public-domain ICAR item resource and 16-item sample test.',
    relevance: 'The primary source for the ICAR short form under consideration as a replacement for Called’s custom aptitude puzzles.',
  },
  {
    id: 'icar-number-series',
    title: 'Evaluating an Automated Number Series Item Generator Using Linear Logistic Test Models',
    authors: 'Arendasy & Sommer',
    venue: 'Journal of Intelligence',
    year: 2019,
    url: 'https://doi.org/10.3390/jintelligence6020020',
    method: 'Uses the ICAR-16 as a construct-validity benchmark for automatically generated number-series items.',
    relevance: 'Supports the specific reasoning construct used by ICAR while illustrating that item-generation validity must be tested against an established measure.',
  },
  {
    id: 'icar-mobile-validation',
    title: 'Validation of International Cognitive Ability Resource (ICAR) Implemented in Mobile Toolbox',
    authors: 'Young et al.',
    venue: 'Journal of Intelligence',
    year: 2025,
    url: 'https://doi.org/10.3390/jintelligence13120154',
    method: 'Adult validation study of ICAR Puzzle Completion and Block Rotation with internal consistency, test-retest reliability, and convergent validity against gold-standard measures.',
    relevance: 'Directly supports web/mobile administration of ICAR components, while showing the evidence is for fluid/nonverbal ability—not occupational fit.',
  },
  {
    id: 'icar-child-validation',
    title: 'Validation of the Children’s International Cognitive Ability Resource (Ch-ICAR)',
    authors: 'Dutry et al.',
    venue: 'Behavior Research Methods',
    year: 2025,
    url: 'https://doi.org/10.3758/s13428-024-02591-1',
    method: 'Validation of an age-specific ICAR form against established cognitive measures for children.',
    relevance: 'Shows that ICAR forms need population-specific validation; Called should not silently reuse adult evidence for younger users.',
  },
  {
    id: 'omib-validation',
    title: 'Development and Validation of the Open Matrices Item Bank',
    authors: 'Koch, Spinath, Greiff & Becker',
    venue: 'Journal of Intelligence',
    year: 2022,
    url: 'https://doi.org/10.3390/jintelligence10030041',
    method: '220 figural-matrix items evaluated with item-response models, reliability analysis, and measurement-invariance analysis in 2,561 medical-school applicants.',
    relevance: 'Provides the strongest open item-bank candidate for a faithful web-based reasoning assessment, but the paper reports no predictive or occupational criterion validity.',
  },
  {
    id: 'mars-validation',
    title: 'An item response theory analysis of the matrix reasoning item bank (MaRs-IB)',
    authors: 'Zorowitz et al.',
    venue: 'Behavior Research Methods',
    year: 2023,
    url: 'https://doi.org/10.3758/s13428-023-02067-8',
    method: 'Independent item-response-theory validation of an open matrix-reasoning bank with form construction and convergent validity analysis.',
    relevance: 'Useful comparison evidence for open reasoning banks, but its reuse terms are non-commercial and its authors caution against treating it as a normative intelligence measure.',
  },
  {
    id: 'interest-hit-rates',
    title: 'How accurate are interest inventories? A quantitative review of career choice hit rates',
    authors: 'Hanna & Rounds',
    venue: 'Psychological Bulletin',
    year: 2021,
    url: 'https://doi.org/10.1037/bul0000269',
    method: 'Binomial-normal meta-analysis of nearly a century of interest-inventory research.',
    relevance: 'Supports using measured vocational interests as one input to exploration, while showing that interests are not a deterministic career selector.',
  },
  {
    id: 'interest-performance',
    title: 'Vocational interests and performance: A quantitative summary of over 60 years of research',
    authors: 'Nye, Su, Rounds & Drasgow',
    venue: 'Perspectives on Psychological Science',
    year: 2012,
    url: 'https://doi.org/10.1177/1745691612449021',
    method: 'Quantitative review of interest-performance research, including interest congruence and occupational outcomes.',
    relevance: 'Supports interest congruence as a modest signal related to performance and persistence, not as proof that a person will succeed.',
  },
  {
    id: 'caas',
    title: 'Career Adapt-Abilities Scale: Construction, reliability, and measurement equivalence across 13 countries',
    authors: 'Savickas & Porfeli',
    venue: 'Journal of Vocational Behavior',
    year: 2012,
    url: 'https://doi.org/10.1016/j.jvb.2012.01.011',
    method: 'Cross-national scale construction with reliability and measurement-equivalence testing across 13 countries.',
    relevance: 'Provides a validated alternative for measuring career adaptability—the capacity to manage career tasks and transitions—if Called adds a formal measure later.',
  },
  {
    id: 'caas-reliability',
    title: 'Career Adapt-Abilities Scale: Reliability generalization meta-analysis',
    authors: 'Demirtaş-Zorbaz, Kılıç & Arıkan',
    venue: 'Psychological Reports',
    year: 2024,
    url: 'https://doi.org/10.1177/00332941241278327',
    method: 'Reliability-generalization meta-analysis across studies using the Career Adapt-Abilities Scale.',
    relevance: 'Shows why reliability should be estimated across samples instead of assumed from one local pilot.',
  },
  {
    id: 'cdse',
    title: 'Evaluation of a short form of the Career Decision-Making Self-Efficacy Scale',
    authors: 'Betz, Klein & Taylor',
    venue: 'Journal of Career Assessment',
    year: 1996,
    url: 'https://doi.org/10.1177/106907279600400103',
    method: 'Short-form scale evaluation for career decision-making self-efficacy, with psychometric and criterion-related evidence.',
    relevance: 'Points to a validated construct for tracking whether a user feels able to make and act on career decisions; Called currently does not measure it directly.',
  },
  {
    id: 'sjt-meta-analysis',
    title: 'Situational judgement test validity for selection: A systematic review and meta-analysis',
    authors: 'Patterson et al.',
    venue: 'Medical Education',
    year: 2020,
    url: 'https://doi.org/10.1111/medu.14201',
    method: 'Systematic review and meta-analysis of predictive validity across situational-judgment-test contexts.',
    relevance: 'Supports scenario-based assessment only when scenarios, response formats, scoring keys, and target outcomes are developed and validated for the intended context.',
  },
  {
    id: 'sjt-design',
    title: 'Use of situational judgment tests to predict job performance: A clarification of the literature',
    authors: 'McDaniel, Morgeson, Finnegan, Campion & Braverman',
    venue: 'Journal of Applied Psychology',
    year: 2001,
    url: 'https://doi.org/10.1037/0021-9010.86.4.730',
    method: 'Review of the development history and validity evidence for situational-judgment tests.',
    relevance: 'Supports Called’s scenario format as a learning pattern, but not the current editorial “professional approach” percentage as a validated score.',
  },
  {
    id: 'mechanical-combination',
    title: 'Mechanical versus clinical data combination in selection and admissions decisions: A meta-analysis',
    authors: 'Kuncel, Klieger, Connelly & Ones',
    venue: 'Journal of Applied Psychology',
    year: 2014,
    url: 'https://doi.org/10.1037/a0037846',
    method: 'Meta-analysis comparing mechanical combination of structured data with holistic clinical judgment.',
    relevance: 'Supports transparent, pre-specified combination rules over opaque human-style intuition; it does not validate Called’s particular weights.',
  },
  {
    id: 'whole-person-fit',
    title: 'Toward whole-person fit assessment: Integrating interests, values, skills, knowledge, and personality using O*NET',
    authors: 'Liu, Hoff, Chu, Oswald & Rounds',
    venue: 'Journal of Applied Psychology',
    year: 2024,
    url: 'https://doi.org/10.1037/apl0001232',
    method: 'Whole-person person-occupation fit framework integrating multiple individual-difference domains with O*NET occupation data.',
    relevance: 'Supports combining several kinds of evidence and occupation descriptors instead of treating one quiz as destiny.',
  },
  {
    id: 'person-vocation-fit',
    title: 'Influence of person-vocation fit on satisfaction and persistence in vocational training programs',
    authors: 'Schmitt, Zacher & colleagues',
    venue: 'Frontiers in Psychology',
    year: 2022,
    url: 'https://doi.org/10.3389/fpsyg.2022.834543',
    method: 'Analysis of person-vocation fit indicators in German National Educational Panel Study data, with satisfaction and persistence outcomes.',
    relevance: 'Supports checking interest, education match, and skill match together when discussing persistence; it is not evidence that Called predicts an individual’s future.',
  },
  {
    id: 'career-interventions',
    title: 'A systematic review on career interventions for high school students',
    authors: 'Wang, Li & Wang',
    venue: 'Frontiers in Psychology',
    year: 2024,
    url: 'https://doi.org/10.3389/fpsyg.2024.1461503',
    method: 'Systematic review of career interventions, their theoretical models, delivery formats, and measured outcomes for high-school students.',
    relevance: 'Supports the product direction of repeated exploration, reflection, information, and action; it does not validate Called’s particular sequence or prompts.',
  },
  {
    id: 'construct-validation',
    title: 'Construct validation in social and personality research: Current practice and recommendations',
    authors: 'Flake, Pek & Hehman',
    venue: 'Social Psychological and Personality Science',
    year: 2017,
    url: 'https://doi.org/10.1177/1948550617693063',
    method: 'Methodological review of construct definition, measurement, and validation practice.',
    relevance: 'Sets the bar Called’s custom item banks would need to clear: explicit construct definitions, content evidence, internal structure, relations to other variables, and appropriate use.',
  },
  {
    id: 'alpha',
    title: 'Thinking twice about Cronbach’s alpha',
    authors: 'McNeish & Wolf',
    venue: 'Journal of Management',
    year: 2020,
    url: 'https://doi.org/10.1177/0149206319887788',
    method: 'Methodological review of assumptions and alternatives for internal-consistency reliability.',
    relevance: 'Explains why a short custom quiz cannot claim reliability just because its items look consistent; future validation should report appropriate reliability and uncertainty.',
  },
];

export const RESEARCH_AUDIT: ResearchAudit[] = [
  {
    id: 'interests',
    area: 'Interests',
    current: 'Thirty custom activity prompts are scored as six plain-language interest families, then nudged by reflections and experiences.',
    status: 'Evidence-backed construct',
    evidence: 'Vocational-interest research supports interests as useful, modest signals for exploration and fit when measured with validated instruments.',
    limit: 'Called’s 30 items, wording, family mapping, reliability, norms, and outcome validity have not been studied as an instrument.',
    next: 'Keep the prompts as an exploration exercise. Before calling the result an assessment, adopt or license a validated interest measure and publish its administration and scoring rules.',
    sources: ['interest-hit-rates', 'interest-performance', 'whole-person-fit'],
  },
  {
    id: 'skills',
    area: 'Skills',
    current: 'Users rate 14 skills from what they have done so far; the matcher uses those self-ratings as a current-skill signal.',
    status: 'Called-specific evidence missing',
    evidence: 'Self-report can describe a person’s current perception, but a self-rating is not the same thing as an observed work sample or a validated skills test.',
    limit: 'No inter-rater reliability, criterion validity, response-bias study, or norm group exists for Called’s skill ratings.',
    next: 'Treat this as a reflection prompt. Build structured, role-relevant work samples with explicit rubrics before using performance claims.',
    sources: ['whole-person-fit', 'construct-validation'],
  },
  {
    id: 'aptitudes',
    area: 'Aptitude puzzles',
    current: 'Fifteen custom right-or-wrong puzzles cover numerical, verbal, logical, detail, and spatial reasoning.',
    status: 'Called-specific evidence missing',
    evidence: 'Ability tests can be useful when normed and validated for a defined construct, population, and outcome.',
    limit: 'These items have no norm group, item analysis, difficulty calibration, reliability estimate, fairness analysis, or criterion-related validation. They are not a professional aptitude test.',
    next: 'Do not use the custom puzzle score to rank careers. A future replacement should use a licensed or public-domain normed ability measure with documented validity, or keep this as an unscored practice activity.',
    sources: ['construct-validation', 'whole-person-fit'],
  },
  {
    id: 'work-style',
    area: 'Work style',
    current: 'Twelve forced-choice pairs create six preference axes such as social/independent and structured/open-ended.',
    status: 'Called-specific evidence missing',
    evidence: 'Work preferences can be relevant to person-environment fit when the construct and measure are validated.',
    limit: 'Called’s axes are editorial categories, not a validated personality or work-values scale; the forced choices also hide how strong or situational a preference is.',
    next: 'Use this only to start a conversation. A replacement should be a validated work-values or personality measure with documented reliability and measurement invariance.',
    sources: ['whole-person-fit', 'construct-validation'],
  },
  {
    id: 'values',
    area: 'Values',
    current: 'Users sort 14 values into four priority tiers; career records declare which values a field tends to support or strain.',
    status: 'Evidence-backed construct',
    evidence: 'Values are a legitimate person-environment-fit domain and can help surface tradeoffs in career decisions.',
    limit: 'The Called value list and career annotations have not been validated, and “supports” or “strains” is a broad editorial claim rather than a measured workplace climate.',
    next: 'Keep values as an explicit tradeoff conversation. Validate the item taxonomy and occupation annotations with expert review and user outcome data before presenting them as measured fit.',
    sources: ['whole-person-fit', 'person-vocation-fit', 'construct-validation'],
  },
  {
    id: 'lifestyle',
    area: 'Lifestyle and constraints',
    current: 'Users choose preferences about training, debt, income, schedule, location, remote work, physical demands, travel, balance, and uncertainty.',
    status: 'Descriptive source',
    evidence: 'These questions capture constraints a user can reasonably weigh directly; they are not presented as psychological traits.',
    limit: 'The compatibility tables are Called rules. They are not estimates of personal happiness, job success, or causal outcomes.',
    next: 'Keep the constraints visible and editable. Source location-sensitive wages, training costs, schedules, and job conditions; show uncertainty instead of implying a precise fit score.',
    sources: ['person-vocation-fit', 'whole-person-fit'],
  },
  {
    id: 'simulations',
    area: 'Career simulations',
    current: 'Short scenario exercises show a possible professional approach and ask the user to reflect on enjoyment, frustration, and repeat interest.',
    status: 'Evidence-informed method',
    evidence: 'Scenario-based assessments can show validity when they use a defined construct, content blueprint, SME-developed keys, appropriate response formats, reliability studies, and criterion validation.',
    limit: 'Called’s scenarios and editorial scores have not been validated. A percentage of choices matching an editorial key is not evidence that a career will fit or that a user has an aptitude.',
    next: 'Called now uses simulations as exposure and reflection, not as scored aptitude evidence. A future scored version must follow SJT/work-sample validation practice and report results before influencing matching.',
    sources: ['sjt-meta-analysis', 'sjt-design', 'construct-validation'],
  },
  {
    id: 'experiments',
    area: 'Purpose experiments',
    current: 'Small real-world activities are followed by a 1–5 reflection on energy, meaning, and repeat interest.',
    status: 'Evidence-informed method',
    evidence: 'Career-intervention research supports active exploration, information, reflection, and action as ingredients worth evaluating.',
    limit: 'Called has not run a controlled outcome study. A positive reflection is useful personal evidence, not proof of intervention efficacy.',
    next: 'Keep experiments low-risk and voluntary. Measure completion, learning, confidence, and later decisions in a preregistered evaluation before making efficacy claims.',
    sources: ['career-interventions', 'cdse'],
  },
  {
    id: 'matching',
    area: 'Career matching',
    current: 'Eight transparent dimensions are combined with fixed weights, then adjusted by experience, conflicts, and career status.',
    status: 'Called-specific evidence missing',
    evidence: 'Mechanical combination of structured inputs is generally more defensible than opaque holistic judgment, and whole-person fit supports combining multiple domains.',
    limit: 'No Called dataset shows calibration, predictive validity, subgroup fairness, test-retest stability, or incremental value over simpler baselines. The score is decision support, not a validated prediction.',
    next: 'Keep the formula inspectable and label uncertainty. Before increasing claims, preregister weights, evaluate against meaningful user outcomes, test fairness, and publish calibration and error rates.',
    sources: ['mechanical-combination', 'whole-person-fit', 'person-vocation-fit'],
  },
  {
    id: 'path',
    area: 'My Path and evidence gates',
    current: 'A deterministic next-best-step rule asks for missing self-information, reality checks, simulations, conversations, real-world experiments, and cost checks.',
    status: 'Evidence-informed method',
    evidence: 'The sequence is consistent with career-intervention literature that values information, reflection, support, and action over a one-shot answer.',
    limit: 'The order, thresholds, and “leading path” gate are product heuristics. They have not been tested against decision quality or long-term outcomes.',
    next: 'Keep the path framed as a hypothesis. Add a transparent evaluation plan and use validated measures such as career decision self-efficacy or adaptability if the product begins measuring change.',
    sources: ['career-interventions', 'cdse', 'caas'],
  },
  {
    id: 'network',
    area: 'Conversations and local connections',
    current: 'The site points users to established organizations and logs what a conversation taught them, without acting as a contact database.',
    status: 'Evidence-informed method',
    evidence: 'Contextual information from people doing the work can test assumptions that a questionnaire cannot reach.',
    limit: 'A logged conversation is qualitative evidence for one person’s context, not a representative estimate of a field or a validated intervention outcome.',
    next: 'Keep the safety guardrails, encourage multiple perspectives, and distinguish personal testimony from labor-market data.',
    sources: ['career-interventions', 'person-vocation-fit'],
  },
  {
    id: 'market',
    area: 'Pay, outlook, training cost, and ROI',
    current: 'Called displays official or documented labor-market inputs, with a national fallback when local data is unavailable.',
    status: 'Descriptive source',
    evidence: 'These data describe occupations, earnings, outlook, and education cost; they are useful context for decisions.',
    limit: 'Descriptive market data does not prove a career will be satisfying, available to one person, or financially optimal. Pay and outlook vary by place and time.',
    next: 'Keep the source, vintage, geography, and fallback label visible. Avoid causal language and require the user to verify high-stakes decisions with current local sources.',
    sources: ['whole-person-fit', 'person-vocation-fit'],
  },
  {
    id: 'motivation-privacy',
    area: 'Reflection, gamification, reports, and privacy',
    current: 'Journaling, badges, reports, local storage, export/import, and privacy controls support continued use and user ownership.',
    status: 'Called-specific evidence missing',
    evidence: 'These are engagement, communication, and privacy features—not assessments. Their value should be judged by usability, safety, and user-reported usefulness.',
    limit: 'Called has not demonstrated that points, badges, or journaling cause better career outcomes, and privacy architecture alone does not establish psychological efficacy.',
    next: 'Keep evidence ahead of points, make every claim modest, and evaluate retention and decision quality separately from psychometric validity.',
    sources: ['career-interventions', 'construct-validation'],
  },
];

export const INSTRUMENT_CANDIDATES: InstrumentCandidate[] = [
  {
    id: 'omib',
    name: 'Open Matrices Item Bank (OMIB)',
    construct: 'Figural matrices / fluid reasoning',
    evidence: '220 items were calibrated with item-response models and reliability analysis in 2,561 medical-school applicants. Internal consistency was high, but the authors report no convergent, discriminant, or predictive validity data yet.',
    administration: 'Faithful reproduction means using the released 3×3 matrix items, 20 construction elements, the published item solutions, 28-item forms, and the no-time-limit procedure used in the validation study.',
    rights: 'The paper states that the item bank is available under GPLv3. The OSF repository provides implementation instructions, item data, and vector materials; attribution and license notices must travel with the implementation.',
    decision: 'Best open candidate for a controlled Called pilot. Its score may describe figural reasoning only; it must not be converted into job-fit points until an occupational-outcome bridge is established.',
    status: 'Best open candidate',
    links: [
      { label: 'Peer-reviewed validation', url: 'https://doi.org/10.3390/jintelligence10030041' },
      { label: 'Implementation materials', url: 'https://osf.io/4km79/' },
    ],
  },
  {
    id: 'icar',
    name: 'International Cognitive Ability Resource (ICAR)',
    construct: 'General cognitive ability, fluid reasoning, and visual-spatial ability',
    evidence: 'ICAR has an initial public-domain validation and later studies reporting reliability, test-retest stability, and convergence with established reasoning and spatial measures, including a 2025 mobile/web implementation study.',
    administration: 'The exact form, instructions, item pool, scoring, and population must be fixed before use. The legacy project page says the sample test requires registration by email, so “public domain” does not by itself settle the exact distribution workflow.',
    rights: 'Public-domain status is stated by the project and peer-reviewed literature, but Called still needs written confirmation of the exact form and scoring materials it will ship, plus attribution and registration compliance.',
    decision: 'Strong second candidate, especially if the project confirms a production-safe ICAR-16 package. Do not combine adult ICAR evidence with children’s results or claim career prediction.',
    status: 'Requires permission or registration',
    links: [
      { label: 'Initial validation', url: 'https://doi.org/10.1016/j.intell.2014.01.004' },
      { label: 'Mobile/web validation', url: 'https://doi.org/10.3390/jintelligence13120154' },
      { label: 'ICAR project', url: 'https://icar-project.org/' },
    ],
  },
  {
    id: 'onet-ability',
    name: 'O*NET Ability Profiler',
    construct: 'Career-exploration abilities, including verbal, numerical, spatial, and psychomotor abilities',
    evidence: 'It is the most career-specific ability battery found in this review, with official administration, scoring, and career-exploration materials.',
    administration: 'It is retired, includes administrator training and apparatus-based tasks, and cannot be reproduced faithfully as a short self-service web quiz from a subset of items.',
    rights: 'The official archive says the materials are provided as-is for research purposes only and that technical assistance is no longer available.',
    decision: 'Do not embed. If this battery is important, use the official archive only as a research reference or pursue a qualified assessment-partner arrangement.',
    status: 'Not suitable for production',
    links: [
      { label: 'Official archive', url: 'https://www.onetcenter.org/reports/AP_Archive.html' },
      { label: 'Tools license', url: 'https://www.onetcenter.org/license_tools.html' },
    ],
  },
  {
    id: 'mars-ib',
    name: 'Matrix Reasoning Item Bank (MaRs-IB)',
    construct: 'Non-verbal reasoning',
    evidence: 'The original study reports reliability and test-retest evidence, and a later IRT study strengthens the item-level evidence.',
    administration: 'The published work supports a defined matrix task, but the authors recommend further validation and say the bank should not be treated as a normative intelligence measure yet.',
    rights: 'The project materials state academic and non-commercial reuse only.',
    decision: 'Useful research comparator, not a production replacement for Called while the site is public and commercial.',
    status: 'Not suitable for production',
    links: [
      { label: 'Peer-reviewed study', url: 'https://doi.org/10.1098/rsos.190232' },
      { label: 'Materials and reuse terms', url: 'https://sites.google.com/site/blakemorelab/research/mars-ib' },
    ],
  },
  {
    id: 'onet-interest',
    name: 'O*NET Interest Profiler',
    construct: 'RIASEC vocational interests, not aptitude',
    evidence: 'The official tool has reliability and validity documentation, a self-administered web version, an embeddable widget, and an API.',
    administration: 'This is the cleanest immediate replacement for Called’s custom interest prompts, but it does not replace an ability test.',
    rights: 'The official site provides CC licensing and a developer path for embedding or using the API; attribution and modification notices apply.',
    decision: 'Strong adjacent integration for interests. Keep it separate from any aptitude score and use the official widget/API rather than recreating the instrument casually.',
    status: 'Adjacent, not aptitude',
    links: [
      { label: 'Official tool', url: 'https://www.onetcenter.org/IP.html' },
      { label: 'Developer service', url: 'https://services.onetcenter.org/ip' },
      { label: 'Reliability and validity', url: 'https://www.onetcenter.org/reports/IP_RVS.html' },
    ],
  },
];

export const researchSourceById = Object.fromEntries(RESEARCH_SOURCES.map((source) => [source.id, source])) as Record<string, ResearchSource>;
