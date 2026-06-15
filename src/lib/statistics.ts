/* ==================================================================== */
/*  Real Statistical Engine — Pure JavaScript Implementation             */
/* ==================================================================== */

/* -------------------------------------------------------------------- */
/*  Helpers                                                             */
/* -------------------------------------------------------------------- */

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function variance(values: number[], sample = true): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const ss = sum(values.map((v) => (v - m) ** 2));
  return sample ? ss / (values.length - 1) : ss / values.length;
}

function std(values: number[], sample = true): number {
  return Math.sqrt(variance(values, sample));
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/* Gamma function approximation (Lanczos) */
function gamma(x: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  x -= 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) a += p[i] / (x + i + 1);
  const t = x + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}

/* Regularized incomplete beta function using continued fraction */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-7;
  const FPMIN = Number.MIN_VALUE / EPS;
  let m2: number, aa: number, c: number, d: number, del: number, h: number;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  c = 1;
  d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  h = d;
  for (let m = 1; m <= MAXIT; m++) {
    m2 = 2 * m;
    aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betaIncomplete(x: number, a: number, b: number): number {
  if (x === 0 || x === 1) return x;
  const lnbeta = Math.log(gamma(a)) + Math.log(gamma(b)) - Math.log(gamma(a + b));
  const front = Math.exp(Math.log(x) * a * (1 - x === 0 ? 0 : 1) + Math.log(1 - x) * b * (x === 1 ? 0 : 1) - lnbeta);
  return x < (a + 1) / (a + b + 2) ? (front * betacf(a, b, x)) / a : 1 - (front * betacf(b, a, 1 - x)) / b;
}

/* Regularized incomplete gamma function (lower) */
function gammaIncompleteP(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;
  if (x < a + 1) {
    // Series representation
    let ap = a;
    let del = 1 / a;
    let sum = del;
    for (let n = 1; n <= 10000; n++) {
      ap++;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-7) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - Math.log(gamma(a)));
  } else {
    // Continued fraction
    const gln = Math.log(gamma(a));
    let b = x + 1 - a;
    let c = 1 / Number.MIN_VALUE;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 10000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < Number.MIN_VALUE) d = Number.MIN_VALUE;
      c = b + an / c;
      if (Math.abs(c) < Number.MIN_VALUE) c = Number.MIN_VALUE;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-7) break;
    }
    return 1 - h * Math.exp(-x + a * Math.log(x) - gln);
  }
}

/* -------------------------------------------------------------------- */
/*  Distribution p-values                                               */
/* -------------------------------------------------------------------- */

/** Two-tailed p-value from t-statistic */
export function pValueFromT(t: number, df: number): number {
  const x = df / (df + t * t);
  const p = betaIncomplete(x, df / 2, 0.5);
  return Math.min(1, p);
}

/** p-value from F-statistic */
export function pValueFromF(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1;
  const x = (df1 * f) / (df1 * f + df2);
  return 1 - betaIncomplete(x, df1 / 2, df2 / 2);
}

/** p-value from chi-square statistic */
export function pValueFromChi2(chi2: number, df: number): number {
  if (chi2 <= 0) return 1;
  return 1 - gammaIncompleteP(df / 2, chi2 / 2);
}

/** Critical t value (two-tailed) */
export function criticalT(df: number, alpha: number): number {
  // Newton-Raphson approximation
  let t = 1.96; // start with normal approx
  for (let i = 0; i < 50; i++) {
    const p = pValueFromT(t, df);
    const dt = 0.0001;
    const dp = (pValueFromT(t + dt, df) - p) / dt;
    if (Math.abs(dp) < 1e-15) break;
    const tNew = t - (p - alpha) / dp;
    if (Math.abs(tNew - t) < 1e-8) break;
    t = tNew;
  }
  return t;
}

/** Critical F value */
export function criticalF(df1: number, df2: number, alpha: number): number {
  let f = 1.0;
  for (let i = 0; i < 50; i++) {
    const p = pValueFromF(f, df1, df2);
    const df = 0.0001;
    const dp = (pValueFromF(f + df, df1, df2) - p) / df;
    if (Math.abs(dp) < 1e-15) break;
    const fNew = f - (p - alpha) / dp;
    if (Math.abs(fNew - f) < 1e-8) break;
    f = Math.max(0.001, fNew);
  }
  return f;
}

/* -------------------------------------------------------------------- */
/*  Descriptive Statistics                                              */
/* -------------------------------------------------------------------- */

export function descriptiveStats(values: number[]): {
  n: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
} {
  const n = values.length;
  if (n === 0) {
    return { n: 0, mean: 0, median: 0, std: 0, variance: 0, min: 0, max: 0, q1: 0, q3: 0, iqr: 0, skewness: 0, kurtosis: 0 };
  }

  const m = mean(values);
  const sorted = [...values].sort((a, b) => a - b);
  const med = n % 2 === 1 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const q1v = percentile(values, 0.25);
  const q3v = percentile(values, 0.75);
  const vr = variance(values, true);
  const s = std(values, true);
  const mn = sorted[0];
  const mx = sorted[n - 1];

  // Skewness (adjusted Fisher-Pearson)
  let sk = 0;
  if (n >= 3 && s > 0) {
    const g1 = sum(values.map((v) => Math.pow((v - m) / s, 3))) / n;
    sk = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
  }

  // Excess Kurtosis
  let kt = 0;
  if (n >= 4 && s > 0) {
    const g2 = sum(values.map((v) => Math.pow((v - m) / s, 4))) / n;
    kt = ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 - 3 * (n - 1));
  }

  return {
    n,
    mean: m,
    median: med,
    std: s,
    variance: vr,
    min: mn,
    max: mx,
    q1: q1v,
    q3: q3v,
    iqr: q3v - q1v,
    skewness: sk,
    kurtosis: kt,
  };
}

/* -------------------------------------------------------------------- */
/*  Independent t-test (two groups)                                     */
/* -------------------------------------------------------------------- */

export function tTestIndependent(
  group1: number[],
  group2: number[],
  alpha = 0.05
): {
  t: number;
  df: number;
  pValue: number;
  mean1: number;
  mean2: number;
  std1: number;
  std2: number;
  n1: number;
  n2: number;
  ciLower: number;
  ciUpper: number;
  significant: boolean;
  cohenD: number;
  effectSize: string;
} {
  const n1 = group1.length;
  const n2 = group2.length;
  const m1 = mean(group1);
  const m2 = mean(group2);
  const s1 = std(group1);
  const s2 = std(group2);

  // Welch's t-test (does not assume equal variance)
  const se1 = s1 * s1 / n1;
  const se2 = s2 * s2 / n2;
  const se = Math.sqrt(se1 + se2);
  const t = se === 0 ? 0 : (m1 - m2) / se;

  // Welch-Satterthwaite df
  const num = Math.pow(se1 + se2, 2);
  const den = (se1 * se1) / Math.max(1, n1 - 1) + (se2 * se2) / Math.max(1, n2 - 1);
  const df = den === 0 ? n1 + n2 - 2 : num / den;

  const pValue = pValueFromT(Math.abs(t), df);

  // Confidence interval
  const tCrit = criticalT(df, alpha);
  const diff = m1 - m2;
  const ciLower = diff - tCrit * se;
  const ciUpper = diff + tCrit * se;

  // Cohen's d (pooled)
  const pooledSD = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
  const cohenD = pooledSD === 0 ? 0 : Math.abs(diff) / pooledSD;

  let effectSize = 'Không có hiệu ứng';
  if (cohenD >= 0.8) effectSize = 'Hiệu ứng lớn';
  else if (cohenD >= 0.5) effectSize = 'Hiệu ứng trung bình';
  else if (cohenD >= 0.2) effectSize = 'Hiệu ứng nhỏ';

  return {
    t,
    df,
    pValue,
    mean1: m1,
    mean2: m2,
    std1: s1,
    std2: s2,
    n1,
    n2,
    ciLower,
    ciUpper,
    significant: pValue < alpha,
    cohenD,
    effectSize,
  };
}

/* -------------------------------------------------------------------- */
/*  One-way ANOVA                                                       */
/* -------------------------------------------------------------------- */

export function anovaOneWay(
  groups: number[][],
  alpha = 0.05
): {
  f: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  msBetween: number;
  msWithin: number;
  significant: boolean;
  etaSquared: number;
  groupStats: { mean: number; std: number; n: number }[];
  postHoc: { group1: number; group2: number; diff: number; pValue: number; significant: boolean }[];
} {
  const k = groups.length;
  const groupStats = groups.map((g) => ({ mean: mean(g), std: std(g), n: g.length }));
  const grandMean = mean(groups.flat());
  const N = sum(groups.map((g) => g.length));

  // SS Between
  const ssBetween = sum(groups.map((g) => g.length * Math.pow(mean(g) - grandMean, 2)));
  // SS Within
  const ssWithin = sum(groups.map((g, i) => sum(g.map((v) => Math.pow(v - groupStats[i].mean, 2)))));
  const ssTotal = ssBetween + ssWithin;

  const dfBetween = k - 1;
  const dfWithin = N - k;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const f = msWithin === 0 ? 0 : msBetween / msWithin;
  const pValue = pValueFromF(f, dfBetween, dfWithin);

  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;

  // Tukey HSD post-hoc
  const postHoc: { group1: number; group2: number; diff: number; pValue: number; significant: boolean }[] = [];
  if (msWithin > 0 && dfWithin > 0) {
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const diff = Math.abs(groupStats[i].mean - groupStats[j].mean);
        const se = Math.sqrt(msWithin * (1 / groupStats[i].n + 1 / groupStats[j].n));
        const q = se === 0 ? 0 : diff / se;
        // Approximate Tukey HSD p-value using studentized range (simplified)
        // Use t-distribution as approximation
        const pVal = se === 0 ? 1 : pValueFromT(q * Math.sqrt(2), dfWithin);
        postHoc.push({ group1: i, group2: j, diff, pValue: pVal, significant: pVal < alpha });
      }
    }
  }

  return {
    f,
    dfBetween,
    dfWithin,
    pValue,
    ssBetween,
    ssWithin,
    ssTotal,
    msBetween,
    msWithin,
    significant: pValue < alpha,
    etaSquared,
    groupStats,
    postHoc,
  };
}

/* -------------------------------------------------------------------- */
/*  Chi-square test (contingency table)                                 */
/* -------------------------------------------------------------------- */

export function chiSquareTest(
  observed: number[][],
  alpha = 0.05
): {
  chi2: number;
  df: number;
  pValue: number;
  significant: boolean;
  expected: number[][];
  residuals: number[][];
  cramersV: number;
  contribution: number[][];
} {
  const rows = observed.length;
  const cols = observed[0].length;

  // Row and column totals
  const rowTotals = observed.map((r) => sum(r));
  const colTotals: number[] = [];
  for (let j = 0; j < cols; j++) colTotals[j] = sum(observed.map((r) => r[j]));
  const grandTotal = sum(rowTotals);

  // Expected frequencies
  const expected: number[][] = [];
  const residuals: number[][] = [];
  const contribution: number[][] = [];
  let chi2 = 0;

  for (let i = 0; i < rows; i++) {
    expected[i] = [];
    residuals[i] = [];
    contribution[i] = [];
    for (let j = 0; j < cols; j++) {
      expected[i][j] = (rowTotals[i] * colTotals[j]) / grandTotal;
      const diff = observed[i][j] - expected[i][j];
      residuals[i][j] = expected[i][j] > 0 ? diff / Math.sqrt(expected[i][j]) : 0;
      const cellChi = expected[i][j] > 0 ? (diff * diff) / expected[i][j] : 0;
      contribution[i][j] = chi2 > 0 ? cellChi / chi2 : 0;
      chi2 += cellChi;
    }
  }

  // Recalculate contributions with correct total
  let totalChi = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const diff = observed[i][j] - expected[i][j];
      totalChi += expected[i][j] > 0 ? (diff * diff) / expected[i][j] : 0;
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const diff = observed[i][j] - expected[i][j];
      const cellChi = expected[i][j] > 0 ? (diff * diff) / expected[i][j] : 0;
      contribution[i][j] = totalChi > 0 ? cellChi / totalChi : 0;
    }
  }

  const df = (rows - 1) * (cols - 1);
  const pValue = pValueFromChi2(chi2, df);

  // Cramer's V
  const cramersV = grandTotal > 0 && Math.min(rows - 1, cols - 1) > 0
    ? Math.sqrt(chi2 / (grandTotal * Math.min(rows - 1, cols - 1)))
    : 0;

  return {
    chi2,
    df,
    pValue,
    significant: pValue < alpha,
    expected,
    residuals,
    cramersV,
    contribution,
  };
}

/* -------------------------------------------------------------------- */
/*  Pearson correlation                                                 */
/* -------------------------------------------------------------------- */

export function pearsonCorrelation(
  x: number[],
  y: number[],
  alpha = 0.05
): {
  r: number;
  rSquared: number;
  pValue: number;
  significant: boolean;
  n: number;
  tStat: number;
  ciLower: number;
  ciUpper: number;
  strength: string;
  direction: string;
} {
  const n = Math.min(x.length, y.length);
  if (n < 2) {
    return { r: 0, rSquared: 0, pValue: 1, significant: false, n: 0, tStat: 0, ciLower: 0, ciUpper: 0, strength: 'N/A', direction: 'N/A' };
  }

  const mx = mean(x);
  const my = mean(y);

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  const r = den === 0 ? 0 : num / den;
  const rSquared = r * r;

  // t-statistic
  const absR = Math.abs(r);
  const tStat = absR === 1 ? Infinity : r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = tStat === Infinity ? 0 : pValueFromT(Math.abs(tStat), n - 2);

  // Fisher z-transform for CI
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const zCrit = criticalT(n - 2, alpha) / Math.sqrt(n - 3);
  const ciLower = Math.tanh(z - zCrit);
  const ciUpper = Math.tanh(z + zCrit);

  let strength = 'Không có';
  const absRval = Math.abs(r);
  if (absRval >= 0.7) strength = 'Mạnh';
  else if (absRval >= 0.4) strength = 'Trung bình';
  else if (absRval >= 0.2) strength = 'Yếu';

  const direction = r > 0 ? 'Thuận chiều' : r < 0 ? 'Nghịch chiều' : 'Không';

  return {
    r,
    rSquared,
    pValue,
    significant: pValue < alpha,
    n,
    tStat,
    ciLower,
    ciUpper,
    strength,
    direction,
  };
}

/* -------------------------------------------------------------------- */
/*  Simple linear regression                                            */
/* -------------------------------------------------------------------- */

export function linearRegression(
  x: number[],
  y: number[],
  alpha = 0.05
): {
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  pValue: number;
  significant: boolean;
  n: number;
  stdError: number;
  predictions: number[];
  ssRegression: number;
  ssResidual: number;
  ssTotal: number;
  dfRegression: number;
  dfResidual: number;
  dfTotal: number;
  msRegression: number;
  msResidual: number;
  fStat: number;
  residuals: number[];
  fitted: number[];
} {
  const n = Math.min(x.length, y.length);
  if (n < 2) {
    return {
      slope: 0, intercept: 0, r: 0, rSquared: 0, pValue: 1, significant: false, n: 0,
      stdError: 0, predictions: [], ssRegression: 0, ssResidual: 0, ssTotal: 0,
      dfRegression: 0, dfResidual: 0, dfTotal: 0, msRegression: 0, msResidual: 0, fStat: 0,
      residuals: [], fitted: [],
    };
  }

  const mx = mean(x);
  const my = mean(y);

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    ssXY += dx * dy;
    ssXX += dx * dx;
    ssYY += dy * dy;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = my - slope * mx;

  const fitted = x.map((xi) => intercept + slope * xi);
  const predictions = fitted;
  const residuals = y.map((yi, i) => yi - fitted[i]);

  const ssRegression = sum(fitted.map((f) => Math.pow(f - my, 2)));
  const ssResidual = sum(residuals.map((r) => r * r));
  const ssTotal = ssYY;

  const dfRegression = 1;
  const dfResidual = n - 2;
  const dfTotal = n - 1;

  const msRegression = ssRegression / dfRegression;
  const msResidual = dfResidual > 0 ? ssResidual / dfResidual : 0;

  const fStat = msResidual === 0 ? 0 : msRegression / msResidual;
  const pValue = pValueFromF(fStat, dfRegression, dfResidual);

  const stdError = Math.sqrt(msResidual);

  const r = ssXX > 0 && ssYY > 0 ? ssXY / Math.sqrt(ssXX * ssYY) : 0;

  return {
    slope,
    intercept,
    r,
    rSquared: r * r,
    pValue,
    significant: pValue < alpha,
    n,
    stdError,
    predictions,
    ssRegression,
    ssResidual,
    ssTotal,
    dfRegression,
    dfResidual,
    dfTotal,
    msRegression,
    msResidual,
    fStat,
    residuals,
    fitted,
  };
}

/* -------------------------------------------------------------------- */
/*  Jarque-Bera normality test                                          */
/* -------------------------------------------------------------------- */

export function jarqueBeraTest(
  values: number[],
  alpha = 0.05
): {
  jb: number;
  pValue: number;
  normal: boolean;
} {
  const n = values.length;
  if (n < 4) return { jb: 0, pValue: 1, normal: true };

  const s = descriptiveStats(values);
  const skew = s.skewness;
  const kurt = s.kurtosis;

  const jb = (n / 6) * (skew * skew + (kurt * kurt) / 4);
  const pValue = pValueFromChi2(jb, 2);

  return {
    jb,
    pValue,
    normal: pValue > alpha,
  };
}

/* -------------------------------------------------------------------- */
/*  Shapiro-Wilk normality test (simplified)                            */
/* -------------------------------------------------------------------- */

export function shapiroWilk(values: number[]): {
  w: number;
  pValue: number;
  normal: boolean;
} {
  const n = values.length;
  if (n < 3) return { w: 1, pValue: 1, normal: true };

  const sorted = [...values].sort((a, b) => a - b);
  const m = mean(values);
  const s = std(values);

  if (s === 0) return { w: 1, pValue: 1, normal: true };

  // Shapiro-Wilk approximation (simplified Royston method)
  let W = 0;
  if (n <= 10) {
    // Small sample approximation
    let num = 0;
    for (let i = 0; i < n; i++) {
      num += Math.pow(sorted[i] - m, 2);
    }
    // Use a simple correlation-based approximation
    const expected = sorted.map((_, i) => {
      const p = (i + 1 - 0.375) / (n + 0.25);
      return m + s * normalQuantile(p);
    });
    let cov = 0;
    let varE = 0;
    for (let i = 0; i < n; i++) {
      cov += sorted[i] * expected[i];
      varE += expected[i] * expected[i];
    }
    W = varE > 0 ? (cov * cov) / (varE * num * n) : 1;
  } else {
    // Larger sample: use correlation between order stats and expected order stats
    const expected = sorted.map((_, i) => normalQuantile((i + 1 - 0.375) / (n + 0.25)));
    const sortedStandardized = sorted.map((v) => (v - m) / s);

    const r_corr = pearsonCorrelation(sortedStandardized, expected);
    W = Math.pow(r_corr.r, 2);
  }

  W = Math.min(1, Math.max(0, W));

  // Approximate p-value using Shapiro-Wilk transformation
  const logW = Math.log(1 - W);
  let pValue: number;
  if (n <= 10) {
    const mu = -0.6168 + 1.6475 / Math.sqrt(n);
    const sigma = -0.6479 + 1.7856 / Math.sqrt(n);
    const z = (logW - mu) / sigma;
    pValue = 1 - normalCDF(z);
  } else {
    const mu = -3.0638 + 1.4241 / Math.sqrt(n) + 0.2936 / n;
    const sigma = 1.8969 - 3.4779 / Math.sqrt(n) + 2.0055 / n;
    const z = (logW - mu) / sigma;
    pValue = 1 - normalCDF(z);
  }

  pValue = Math.min(1, Math.max(0, pValue));

  return {
    w: W,
    pValue,
    normal: pValue > 0.05,
  };
}

/** Inverse normal CDF (quantile function) */
function normalQuantile(p: number): number {
  if (p <= 0) return -4;
  if (p >= 1) return 4;
  // Beasley-Springer-Moro approximation
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  const b0 = -8.4735109309;
  const b1 = 23.08336743743;
  const b2 = -21.06224101826;
  const b3 = 3.13082909833;
  const c0 = 0.337475482272615;
  const c1 = 0.976169019091719;
  const c2 = 0.160797971491821;
  const c3 = 0.027643881033386;
  const c4 = 0.00384057293736;
  const c5 = 0.000395189651191;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;

  const y = p - 0.5;
  if (Math.abs(y) < 0.42) {
    const r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) / ((((b3 * r + b2) * r + b1) * r + b0) * r + 1);
  }
  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));
  let x = c0 + r * (c1 + r * (c2 + r * (c3 + r * (c4 + r * (c5 + r * (c6 + r * (c7 + r * c8)))))));
  if (y < 0) x = -x;
  return x;
}

/** Standard normal CDF */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/* -------------------------------------------------------------------- */
/*  Helper: get unique values from array                                */
/* -------------------------------------------------------------------- */

export function getUniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/* -------------------------------------------------------------------- */
/*  Helper: extract numeric column from dataset                         */
/* -------------------------------------------------------------------- */

export function extractNumericColumn(rows: Record<string, any>[], col: string): number[] {
  return rows
    .map((r) => {
      const v = r[col];
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? NaN : n;
      }
      return NaN;
    })
    .filter((v) => !isNaN(v));
}

/* -------------------------------------------------------------------- */
/*  Helper: detect numeric columns                                       */
/* -------------------------------------------------------------------- */

export function detectNumericColumns(rows: Record<string, any>[], headers: string[]): string[] {
  return headers.filter((h) => {
    const numericCount = rows.filter((r) => {
      const v = r[h];
      return typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v)) && v.trim() !== '');
    }).length;
    return numericCount >= rows.length * 0.8;
  });
}

/* -------------------------------------------------------------------- */
/*  Helper: detect categorical columns                                   */
/* -------------------------------------------------------------------- */

export function detectCategoricalColumns(rows: Record<string, any>[], headers: string[], maxUnique = 20): string[] {
  return headers.filter((h) => {
    const unique = getUniqueValues(rows.map((r) => String(r[h]))).filter((v) => v !== '');
    return unique.length <= maxUnique && unique.length >= 2;
  });
}

/* ==================================================================== */
/*  Detailed Interpretation Generator — 10-20 lines per method           */
/* ==================================================================== */

export interface InterpretationInput {
  methodId: string;
  methodNameVi: string;
  dependentVariable: string;
  groupingVariable?: string;
  independentVariable?: string;
  confidenceLevel: number;
  significant: boolean;
  pValue: number;
  testStatistic: { name: string; value: number; df?: string };
  effectSize?: { name: string; value: number; interpretation: string };
  groupStats?: { group: string; n: number; mean: number; sd: number }[];
  descriptiveStats?: { n: number; mean: number; median: number; std: number; min: number; max: number; skewness: number; kurtosis: number };
  correlationExtra?: { r: number; rSquared: number; strength: string; direction: string; ciLower: number; ciUpper: number };
  regressionExtra?: { slope: number; intercept: number; rSquared: number; fStat: number };
  anovaExtra?: { f: number; dfBetween: number; dfWithin: number; etaSquared: number; postHoc?: { pairs: { g1: string; g2: string; diff: number; p: number }[] } };
  chiSquareExtra?: { chi2: number; df: number; cramersV: number; expected: number[][] };
  normalityExtra?: { jb: number; normal: boolean; skewness: number; kurtosis: number };
}

export function generateDetailedInterpretation(input: InterpretationInput): string {
  const lines: string[] = [];
  const alpha = 1 - input.confidenceLevel / 100;

  switch (input.methodId) {
    case 'ttest': {
      const gs = input.groupStats;
      const sig = input.significant;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Phan tich su dung kiem dinh t-doc lap (Welch's t-test) de so sanh trung binh cua bien "${input.dependentVariable}" giua hai nhom doc lap.`);
      if (gs && gs.length >= 2) {
        lines.push(`   Nhom "${gs[0].group}": N=${gs[0].n}, Trung binh=${gs[0].mean.toFixed(2)}, Do lech chuan=${gs[0].sd.toFixed(2)}.`);
        lines.push(`   Nhom "${gs[1].group}": N=${gs[1].n}, Trung binh=${gs[1].mean.toFixed(2)}, Do lech chuan=${gs[1].sd.toFixed(2)}.`);
      }
      lines.push(`   Ket qua: t${input.testStatistic.df ? `(${input.testStatistic.df})` : ''} = ${input.testStatistic.value.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
      lines.push(``);
      lines.push(`2. Y NGHIA THONG KE`);
      if (sig) {
        lines.push(`   Co su khac biet co y nghia thong ke giua hai nhom o muc y nghia ${input.confidenceLevel}% (p < ${alpha}).`);
        lines.push(`   Dieu nay co nghia la khoang tin cay ${input.confidenceLevel}% khong chua gia tri 0, khang dinh su khac biet la thuc su.`);
      } else {
        lines.push(`   KHONG co su khac biet co y nghia thong ke giua hai nhom (p = ${input.pValue.toFixed(4)} > ${alpha}).`);
        lines.push(`   Dieu nay co nghia la khong du bang chung de ket luan hai nhom khac nhau ve mat thong ke.`);
      }
      lines.push(``);
      lines.push(`3. CO HIEU UNG (EFFECT SIZE)`);
      if (input.effectSize) {
        lines.push(`   ${input.effectSize.name} = ${input.effectSize.value.toFixed(3)} — ${input.effectSize.interpretation}.`);
        if (input.effectSize.value >= 0.8) lines.push(`   Day la hieu ung lon, cho thay chenh lech thuc su dang ke giua hai nhom.`);
        else if (input.effectSize.value >= 0.5) lines.push(`   Day la hieu ung trung binh, cho thay su khac biet co the quan sat duoc trong thuc te.`);
        else if (input.effectSize.value >= 0.2) lines.push(`   Day la hieu ung nho, su khac biet ton tai nhung co the kho nhan thay trong thuc te.`);
        else lines.push(`   Hieu ung gan nhu khong dang ke.`);
      }
      lines.push(``);
      lines.push(`4. Y NGHIA THUC TIEN`);
      if (sig && gs && gs.length >= 2) {
        const diff = gs[0].mean - gs[1].mean;
        lines.push(`   Su khac biet trung binh la ${Math.abs(diff).toFixed(2)} don vi, voi nhom "${diff > 0 ? gs[0].group : gs[1].group}" co gia tri cao hon.`);
        lines.push(`   Can xem xet nhom mau: tong co mau N=${gs.reduce((s, g) => s + g.n, 0)}.`);
        if (gs[0].n < 30 || gs[1].n < 30) lines.push(`   LUU Y: Mot hoac ca hai nhom co mau nho (<30), co the anh huong den do chinh xac cua uoc luong.`);
      } else {
        lines.push(`   Mac du khong co y nghia thong ke, can xem xet co mau va do bien thien trong nhom.`);
        lines.push(`   Co the can thiet tang co mau de phat hien hieu ung nho hon.`);
      }
      lines.push(``);
      lines.push(`5. HAN CHE`);
      lines.push(`   — Gia dinh doc lap quan sat can duoc dam bao boi thiet ke nghien cuu.`);
      lines.push(`   — Welch's t-test khong gia dinh phuong sai bang nhau, nhung phan phoi chuan trong moi nhom van can duoc xem xet.`);
      lines.push(`   — Ket qua chi ap dung cho mau nghien cuu, tong quat hoa can than trong.`);
      lines.push(``);
      lines.push(`6. KHUYEN NGHI`);
      if (sig) {
        lines.push(`   - Tim hieu nguyen nhan gay ra su khac biet giua hai nhom.`);
        lines.push(`   - Xem xet cac bien ngoai lai (confounders) co the giai thich su khac biet.`);
        lines.push(`   - Lap lai nghien cuu voi mau lon hon de xac nhan ket qua.`);
      } else {
        lines.push(`   - Tang co mau neu muon phat hien hieu ung nho.`);
        lines.push(`   - Kiem tra du lieu: outliers, phan phoi, do tin cay cua bien do luong.`);
        lines.push(`   - Xem xet cac bien dieu chinh (covariates) co the lam ro moi quan he.`);
      }
      break;
    }

    case 'anova': {
      const ae = input.anovaExtra;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Phan tich phuong sai mot chieu (One-way ANOVA) kiem tra su khac biet trung binh cua bien "${input.dependentVariable}" giua cac nhom.`);
      lines.push(`   Ket qua: F${ae ? `(${ae.dfBetween}, ${ae.dfWithin})` : ''} = ${input.testStatistic.value.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
      lines.push(``);
      lines.push(`2. Y NGHIA THONG KE`);
      if (input.significant) {
        lines.push(`   Co su khac biet co y nghia thong ke giua it nhat hai nhom (p < ${alpha}).`);
        lines.push(`   Tuy nhien, ANOVA khong cho biet cu the nhom nao khac nhau — can phan tich post-hoc.`);
      } else {
        lines.push(`   KHONG co su khac biet co y nghia thong ke giua cac nhom (p = ${input.pValue.toFixed(4)}).`);
        lines.push(`   Cac nhom co the co cung gia tri trung binh tong the.`);
      }
      lines.push(``);
      lines.push(`3. CO HIEU UNG`);
      if (input.effectSize) {
        lines.push(`   ${input.effectSize.name} = ${input.effectSize.value.toFixed(3)} — ${input.effectSize.interpretation}.`);
        if (ae) {
          const pct = (ae.etaSquared * 100).toFixed(1);
          lines.push(`   Dieu nay co nghia la ${pct}% phuong sai cua "${input.dependentVariable}" duoc giai thich boi bien phan nhom.`);
        }
      }
      lines.push(``);
      lines.push(`4. PHAN TICH POST-HOC`);
      if (ae?.postHoc && ae.postHoc.pairs.length > 0) {
        lines.push(`   Cac cap nhom so sanh:`);
        for (const pair of ae.postHoc.pairs) {
          const ps = pair.p < alpha ? 'co y nghia' : 'khong y nghia';
          lines.push(`   · "${pair.g1}" vs "${pair.g2}": chenh lech = ${pair.diff.toFixed(2)}, p = ${pair.p.toFixed(4)} (${ps})`);
        }
      } else if (input.significant) {
        lines.push(`   Can thuc hien kiem dinh post-hoc (Tukey HSD, Bonferroni) de xac dinh nhom nao khac biet.`);
      } else {
        lines.push(`   Khong can post-hoc vi ANOVA khong co y nghia.`);
      }
      lines.push(``);
      lines.push(`5. Y NGHIA THUC TIEN`);
      if (input.groupStats) {
        lines.push(`   Thong ke mo ta cac nhom:`);
        for (const g of input.groupStats) {
          lines.push(`   · "${g.group}": N=${g.n}, M=${g.mean.toFixed(2)}, SD=${g.sd.toFixed(2)}`);
        }
      }
      lines.push(``);
      lines.push(`6. HAN CHE`);
      lines.push(`   — ANOVA gia dinh doc lap quan sat, phan phoi chuan trong moi nhom, va phuong sai dong nhat.`);
      lines.push(`   — Levene's test nen duoc kiem tra truoc khi ket luan.`);
      lines.push(`   — Cac nhom co co mau khong deu co the anh huong den ket qua.`);
      lines.push(``);
      lines.push(`7. KHUYEN NGHI`);
      if (input.significant) {
        lines.push(`   - Thuc hien post-hoc de xac dinh cap nhom khac biet.`);
        lines.push(`   - Kiem tra gia dinh ANOVA (Levene, normality).`);
        lines.push(`   - Can nhac phan tich da bien neu co nhieu bien doc lap.`);
      } else {
        lines.push(`   - Tang co mau hoac giam so nhom de tang suc manh thong ke.`);
        lines.push(`   - Kiem tra du lieu va cac bien dieu chinh.`);
      }
      break;
    }

    case 'correlation': {
      const ce = input.correlationExtra;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Phan tich tuong quan Pearson do luong moi quan he tuyen tinh giua "${input.dependentVariable}" va "${input.independentVariable}".`);
      if (ce) {
        lines.push(`   He so tuong quan r = ${ce.r.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
        lines.push(`   Moi tuong quan ${ce.direction.toLowerCase()} ${ce.strength.toLowerCase()}.`);
      }
      lines.push(``);
      lines.push(`2. Y NGHIA THONG KE`);
      if (input.significant) {
        lines.push(`   Co moi tuong quan co y nghia thong ke giua hai bien (p < ${alpha}).`);
        if (ce) lines.push(`   Khoang tin cay ${input.confidenceLevel}%: [${ce.ciLower.toFixed(3)}, ${ce.ciUpper.toFixed(3)}].`);
      } else {
        lines.push(`   KHONG co moi tuong quan co y nghia thong ke (p = ${input.pValue.toFixed(4)}).`);
        lines.push(`   Khong du bang chung de ket luan hai bien co moi quan he tuyen tinh.`);
      }
      lines.push(``);
      lines.push(`3. Y NGHIA THUC TIEN`);
      if (ce) {
        const pct = (ce.rSquared * 100).toFixed(1);
        lines.push(`   He so xac dinh R² = ${ce.rSquared.toFixed(3)}, tuc la ${pct}% phuong sai cua "${input.dependentVariable}" duoc giai thich boi "${input.independentVariable}".`);
        if (ce.rSquared > 0.5) lines.push(`   Day la muc giai thich cao, cho thay moi quan he manh me.`);
        else if (ce.rSquared > 0.25) lines.push(`   Day la muc giai thich trung binh, con nhieu yeu to khac anh huong.`);
        else lines.push(`   Day la muc giai thich thap, hau het phuong sai khong duoc giai thich.`);
      }
      lines.push(`   LUU Y: Tuong quan khong dong nghia voi nhan qua.`);
      lines.push(``);
      lines.push(`4. HAN CHE`);
      lines.push(`   — Tuong quan Pearson chi do moi quan he tuyen tinh; quan he phi tuyen co the bi bo sot.`);
      lines.push(`   — Outliers co the lam bien dang he so tuong quan dang ke.`);
      lines.push(`   — Gia dinh phan phoi chuan cua ca hai bien.`);
      lines.push(``);
      lines.push(`5. KHUYEN NGHI`);
      if (input.significant && ce && Math.abs(ce.r) > 0.3) {
        lines.push(`   - Xem xet mo hinh hoi quy de du doan "${input.dependentVariable}" tu "${input.independentVariable}".`);
      }
      lines.push(`   - Kiem tra scatter plot de danh gia tinh tuyen tinh.`);
      lines.push(`   - Tim cac bien thu ba co the anh huong den ca hai bien (common cause).`);
      lines.push(`   - Khong su dung de ket luan quan he nhan qua.`);
      break;
    }

    case 'regression': {
      const re = input.regressionExtra;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Mo hinh hoi quy tuyen tinh don bien: "${input.dependentVariable}" = f("${input.independentVariable}").`);
      if (re) {
        lines.push(`   Phuong trinh: ${input.dependentVariable} = ${re.intercept.toFixed(3)} + ${re.slope.toFixed(3)} * ${input.independentVariable}.`);
        lines.push(`   F(${input.testStatistic.df}) = ${input.testStatistic.value.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
      }
      lines.push(``);
      lines.push(`2. Y NGHIA THONG KE`);
      if (input.significant) {
        lines.push(`   Mo hinh co y nghia thong ke (p < ${alpha}), bien doc lap co kha nang du doan bien phu thuoc.`);
      } else {
        lines.push(`   Mo hinh KHONG co y nghia thong ke (p = ${input.pValue.toFixed(4)}).`);
        lines.push(`   Bien doc lap khong co kha nang du doan co y nghia.`);
      }
      lines.push(``);
      lines.push(`3. CHAT LUONG MO HINH`);
      if (input.effectSize) {
        const r2 = input.effectSize.value;
        lines.push(`   R² = ${r2.toFixed(3)} — ${input.effectSize.interpretation}.`);
        if (r2 >= 0.5) lines.push(`   Mo hinh co kha nang du doan tot.`);
        else if (r2 >= 0.25) lines.push(`   Mo hinh co kha nang du doan o muc trung binh.`);
        else lines.push(`   Mo hinh yeu, can bo sung bien doc lap khac.`);
      }
      lines.push(``);
      lines.push(`4. Y NGHIA THUC TIEN`);
      if (re) {
        const dir = re.slope > 0 ? 'tang' : 'giam';
        lines.push(`   Khi "${input.independentVariable}" tang 1 don vi, "${input.dependentVariable}" se ${dir} ${Math.abs(re.slope).toFixed(3)} don vi.`);
        lines.push(`   Gia tri cat (intercept) = ${re.intercept.toFixed(3)}: gia tri du doan cua "${input.dependentVariable}" khi "${input.independentVariable}" = 0.`);
      }
      lines.push(``);
      lines.push(`5. HAN CHE`);
      lines.push(`   — Hoi quy tuyen tinh gia dinh quan he tuyen tinh, doc lap, dong nhat phuong sai.`);
      lines.push(`   — Outliers va diem co anh huong lon (influential points) can duoc kiem tra.`);
      lines.push(`   — Tuong quan cao giua bien doc lap va phan du chi ra van de cua mo hinh.`);
      lines.push(`   — Voi mo hinh don bien, chua kiem soat cac bien ngoai lai.`);
      lines.push(``);
      lines.push(`6. KHUYEN NGHI`);
      lines.push(`   - Kiem tra gia dinh hoi quy (linearity, normality of residuals, homoscedasticity).`);
      lines.push(`   - Xem xet them bien doc lap de cai thien R² (hoi quy da bien).`);
      if (input.significant) {
        lines.push(`   - Co the su dung mo hinh de du doan trong khoang du lieu quan sat.`);
        lines.push(`   - TRANH du doan ngoai khoang du lieu (extrapolation).`);
      }
      break;
    }

    case 'chisquare': {
      const cs = input.chiSquareExtra;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Kiem dinh Chi-square kiem tra moi lien he gia hai bien phan loai: "${input.dependentVariable}" va "${input.groupingVariable}".`);
      lines.push(`   Ket qua: \u03C7²${cs ? `(${cs.df})` : ''} = ${input.testStatistic.value.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
      lines.push(``);
      lines.push(`2. Y NGHIA THONG KE`);
      if (input.significant) {
        lines.push(`   Co moi lien he co y nghia thong ke giua hai bien (p < ${alpha}).`);
        lines.push(`   Cac bien khong doc lap voi nhau.`);
      } else {
        lines.push(`   KHONG co moi lien he co y nghia thong ke (p = ${input.pValue.toFixed(4)}).`);
        lines.push(`   Co the xem hai bien la doc lap.`);
      }
      lines.push(``);
      lines.push(`3. CO HIEU UNG`);
      if (input.effectSize) {
        lines.push(`   ${input.effectSize.name} = ${input.effectSize.value.toFixed(3)} — ${input.effectSize.interpretation}.`);
        if (cs) {
          const cv = cs.cramersV;
          if (cv >= 0.25) lines.push(`   Day la moi lien he manh me giua hai bien phan loai.`);
          else if (cv >= 0.15) lines.push(`   Day la moi lien he trung binh.`);
          else if (cv >= 0.1) lines.push(`   Day la moi lien he yeu.`);
          else lines.push(`   Moi lien he rat yeu hoac khong dang ke.`);
        }
      }
      lines.push(``);
      lines.push(`4. Y NGHIA THUC TIEN`);
      if (cs) {
        const expOk = cs.expected.flat().filter((e) => e >= 5).length;
        const expTotal = cs.expected.flat().length;
        const pct = (expOk / expTotal * 100).toFixed(0);
        lines.push(`   Tan so ky vong: ${pct}% o co tan so >= 5.`);
        if (expOk < expTotal * 0.8) {
          lines.push(`   LUU Y: Nhieu o co tan so ky vong < 5, ket qua can duoc xem xet than trong.`);
          lines.push(`   Nen gop cac nhom nho lai hoac su dung Fisher's exact test.`);
        }
      }
      lines.push(``);
      lines.push(`5. HAN CHE`);
      lines.push(`   — Yeu cau tan so ky vong du lon (>= 5 trong 80% so o).`);
      lines.push(`   — Chi ap dung cho bang cheo 2 chieu.`);
      lines.push(`   — Khong do cuong do va chieu cua moi quan he chi tiet.`);
      lines.push(``);
      lines.push(`6. KHUYEN NGHI`);
      if (input.significant) {
        lines.push(`   - Phan tich phan du chuan hoa de tim o dong gop nhieu nhat.`);
        lines.push(`   - Xem xet mo hinh logistic neu can du doan.`);
      } else {
        lines.push(`   - Tang co mau de tang suc manh thong ke.`);
        lines.push(`   - Kiem tra bien phan loai co qua nhieu hang muc khong.`);
      }
      break;
    }

    case 'descriptive': {
      const ds = input.descriptiveStats;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Thong ke mo ta cho bien "${input.dependentVariable}".`);
      if (ds) {
        lines.push(`   Co mau N = ${ds.n}.`);
        lines.push(`   Trung binh = ${ds.mean.toFixed(2)}, Trung vi = ${ds.median.toFixed(2)}, Do lech chuan = ${ds.std.toFixed(2)}.`);
        lines.push(`   Min = ${ds.min.toFixed(2)}, Max = ${ds.max.toFixed(2)}.`);
      }
      lines.push(``);
      lines.push(`2. PHAN PHOI DU LIEU`);
      if (ds) {
        const skew = ds.skewness;
        const kurt = ds.kurtosis;
        if (Math.abs(skew) < 0.5) lines.push(`   Do lech (Skewness = ${skew.toFixed(3)}): phan phoi kha doi xung.`);
        else if (skew > 0.5) lines.push(`   Do lech duong (Skewness = ${skew.toFixed(3)}): co duoi keo ve ben phai.`);
        else lines.push(`   Do lech am (Skewness = ${skew.toFixed(3)}): co duoi keo ve ben trai.`);
        if (Math.abs(kurt) < 0.5) lines.push(`   Do nhon (Kurtosis = ${kurt.toFixed(3)}): gan tuong tu phan phoi chuan.`);
        else if (kurt > 0.5) lines.push(`   Do nhon cao (Kurtosis = ${kurt.toFixed(3)}): nhieu gia tri tap trung o trung tam.`);
        else lines.push(`   Do nhon thap (Kurtosis = ${kurt.toFixed(3)}): phan tan deu hon phan phoi chuan.`);
      }
      lines.push(``);
      lines.push(`3. NHAN XET`);
      if (ds) {
        if (Math.abs(ds.mean - ds.median) > ds.std * 0.2) {
          lines.push(`   Trung binh va trung vi chenh lech dang ke, co the co outliers hoac phan phoi khong doi xung.`);
        } else {
          lines.push(`   Trung binh va trung vi gan nhau, phan phoi tuong doi doi xung.`);
        }
      }
      lines.push(``);
      lines.push(`4. KHUYEN NGHI`);
      lines.push(`   - Nen bieu dien bang bieu do tan suat (histogram) va box plot.`);
      lines.push(`   - Kiem tra outliers bang IQR rule.`);
      lines.push(`   - Neu phan phoi khong chuan, xem xet bien doi (transformation).`);
      break;
    }

    case 'normality': {
      const ne = input.normalityExtra;
      lines.push(`1. TOM TAT PHAN TICH`);
      lines.push(`   Kiem dinh Jarque-Bera danh gia gia dinh phan phoi chuan cua bien "${input.dependentVariable}".`);
      lines.push(`   Ket qua: JB = ${ne?.jb.toFixed(3) ?? input.testStatistic.value.toFixed(3)}, p = ${input.pValue.toFixed(4)}.`);
      lines.push(``);
      lines.push(`2. KET LUAN`);
      if (ne?.normal ?? input.pValue > alpha) {
        lines.push(`   Du lieu CO THE duoc xem la tuan theo phan phoi chuan (p > ${alpha}).`);
        lines.push(`   Co the su dung cac phuong phap tham so (parametric tests).`);
      } else {
        lines.push(`   Du lieu KHONG tuan theo phan phoi chuan (p <= ${alpha}).`);
        lines.push(`   Nen su dung cac phuong phap phi tham so (non-parametric tests).`);
      }
      lines.push(``);
      lines.push(`3. CHI TET`);
      if (ne) {
        lines.push(`   Do lech: Skewness = ${ne.skewness.toFixed(3)}.`);
        lines.push(`   Do nhon: Kurtosis = ${ne.kurtosis.toFixed(3)}.`);
        if (Math.abs(ne.skewness) > 1) lines.push(`   Do lech dang ke, anh huong lon den gia dinh chuan.`);
        if (Math.abs(ne.kurtosis) > 1) lines.push(`   Do nhon bat thuong, can xem xet.`);
      }
      lines.push(``);
      lines.push(`4. KHUYEN NGHI`);
      if (ne?.normal ?? input.pValue > alpha) {
        lines.push(`   - T-test, ANOVA co the duoc ap dung.`);
        lines.push(`   - Tuy nhien, nen ket hop voi kiem tra do thi Q-Q plot.`);
      } else {
        lines.push(`   - Su dung Mann-Whitney U thay cho t-test.`);
        lines.push(`   - Su dung Kruskal-Wallis thay cho ANOVA.`);
        lines.push(`   - Xem xet bien doi du lieu (log, square root).`);
      }
      break;
    }

    default: {
      lines.push(`Phan tich "${input.methodNameVi}" da duoc thuc hien.`);
      lines.push(`Gia tri p = ${input.pValue.toFixed(4)}.`);
      lines.push(input.significant
        ? `Ket qua co y nghia thong ke (p < ${alpha}).`
        : `Ket qua khong co y nghia thong ke (p >= ${alpha}).`);
    }
  }

  return lines.join('\n');
}
