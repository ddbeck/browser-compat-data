// Primary entry points into this API: `browser()` and `feature()` factory
// functions.

export declare function browser(key: browserKey): Browser;
// You'd use `browser()` to query for browsers, such as `browser("chrome")` or
// `browser("safari")`.

export declare function feature(id: string): Feature;
// And `feature()` to query for specific features, as in
// `feature("dotted.path.to.feature")`.

// Before getting into the weeds, I should note that, ultimately, some methods
// of the objects returned from the factory functions are going to provide
// simplified feature support interpretations. They'll be subject to some
// options, but thanks to the work eliminating `true` and `null` values from
// BCD, we can be more restrictve in the API than we can be in the schema.
declare type supported =
  | hasSupport // Supported
  | lacksSupport // Unsupported
  | hasSupportPartially // Supported, but only satisfied by one or more statements with `partial_implementation` set to `true`
  | undefined; // Release not represented in a given feature
// See the end for stronger definitions of the above.

// The first of the "smart" wrappers around BCD objects. Here, a browser object
// contains some releases and queries for getting at them.
declare class Browser {
  id: browserKey;
  data: object; // Underlying BCD browser object

  // Pass through BCD values where convenient
  name: string;
  type: string;
  preview_name: string;
  // etc.

  constructor(id: browserKey, data: unknown);

  releaseAt(index: number): Release | undefined;
  releaseOn(date: string): Release | undefined;
  releasesFrom(index: number): Release[] | undefined;
  releasesSince(date: string): Release[] | undefined;

  // The last method here is mostly for convenience on the common case of "does
  // this release support a given feature?". It's sugar for
  // `browser(browserKey).releaseAt(0).supports(feature)`.
  supports(feature: Feature): boolean | undefined;
}

// A `Release` represents concrete browser release. That is, it represents a
// specific browser-version pair (i.e., it's unambiguously Chrome 100 or Firefox
// 100). Releases don't imply a bunch of methods, but we'll be using these
// objects in lots of places.
declare class Release {
  browser: Browser;
  data: unknown; // Underlying BCD release object

  // pass through BCD
  version: string;
  release_date: string;
  status: string;
  name: string; // We could even pass through the underlying browser data
  // etc.

  constructor(browser: Browser, releaseData: unknown);

  // Mostly for symmetry with `Browser` and `Feature`. It's sugar for
  // `feature.supportedBy(this)`;
  supports(feature: Feature): boolean;
}

// This is where things get exciting. `Feature` is a wrapper around a `__compat`
// object that's `Release`-aware.
declare class Feature {
  id: string; // dotted.path.to.feature
  data: unknown; // underlying BCD `__compat` object

  constructor(id: string, data: unknown);

  // The simple case is to show a `Feature` a `Release` object and let it
  // respond with boolean-ish value.
  supportedBy(release: Release): supported;

  // But there's no reason we can't pass multiple releases in (and `&&` them
  // together, or near enough to it).
  supportedBy(releases: Release[]): supported;
  supportedBy(...releases: Release[]): supported;

  // But BCD is very nuanced, so we'll need to offer some options, particularly around partial implementations.
  supportedBy(releases: Release[], options: supportedByOptions): supported;

  // Partials and notes will probably require some interrogation. Likewise, some
  // consumers might want a more complex resolution to the question of multiple
  // releases having potentially-conflicting supoprt values. For them, we offer
  // the details for every release as a Map.
  supportDetailsFor(
    releases: Release[],
    options: supportedByOptions,
  ): Map<Release, { supported: supported; notes: Note }>;

  // This is a little more speculative. Maybe you'd like to get notes for a
  // specific release?
  notesFor(release: Release | Release[], options: supportedByOptions): Note[];
}

// Right now, notes apply to support statements (that is, version ranges), but
// we're seeing BCD through a lens of releases. It might be nice to offer a view
// of notes that is explicit about what version the note applies to.
declare class Note {
  release: Release;
  data: unknown; // Underlying BCD note text

  constructor(data: unknown);

  // We could even play with reformatting the text to omit version numbers.
  text(): string;
}

// For completeness:
declare type browserKey = 'chrome' | 'firefox' | 'safari'; // etc.
interface supportedByOptions {
  excludePartialImplementations: boolean;
}

declare type hasSupport = true;
// A given browser-version pair is in the range of versions implied by the
// `version_added` and `version_removed` (if present) values of a BCD support
// statement. To avoid repetition, this means that the browser-version pair is
// satisified by the range test.

declare type lacksSupport = false;
// A given browser-version pair is **not** satisfied by the range test.

declare type hasSupportPartially = 'partially';
// A given browser-verison pair is satisfied by the range test, but the
// satisfactory ranges all have `partial_implementation` set to `true`. That is
// to say, there is no non-partial support statement available which satisfies
// the range test for this browser-version pair.
