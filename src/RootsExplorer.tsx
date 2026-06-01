import { useState, useEffect, useMemo } from "react";
import "./RootsExplorer.css";

interface Lemma {
	lemma: string;
	lemmaArabic: string;
	count: number;
}

interface SampleVerse {
	surah: number;
	ayah: number;
}

interface RootData {
	rank: number;
	root: string;
	rootArabic: string;
	occurrences: number;
	meaning: string;
	lemmas: Lemma[];
	surahCount: number;
	salahFound: string[];
	cumulativeCoverage: number;
	sampleVerses?: SampleVerse[];
}

interface RootsDatabase {
	totalWords: number;
	totalSegments: number;
	segmentsWithRoot: number;
	roots: RootData[];
}

interface SalahWord {
	wordIndex?: number;
	text: string;
	root: string | null;
	rootArabic: string | null;
	lemma?: string | null;
	meaning?: string;
}

interface SalahVerse {
	ayah: number;
	words: SalahWord[];
}

interface SalahSurah {
	id: number | string;
	name: string;
	verses: SalahVerse[];
}

// Liturgical order & contents for extra Salah sections to guarantee completeness
const EXTRA_SALAH_SECTIONS: SalahSurah[] = [
	{
		id: "takbir",
		name: "Takbir (Allahu Akbar)",
		verses: [
			{
				ayah: 1,
				words: [
					{ wordIndex: 1, text: "اللَّهُ", root: "Alh", rootArabic: "ا ل ه", lemma: "ٱللَّه", meaning: "Allah (God)" },
					{ wordIndex: 2, text: "أَكْبَرُ", root: "kbr", rootArabic: "ك ب ر", lemma: "أَكْبَر", meaning: "Greater / Greatest" }
				]
			}
		]
	},
	{
		id: "ruku",
		name: "Ruku (Bowing in Prayer)",
		verses: [
			{
				ayah: 1,
				words: [
					{ wordIndex: 1, text: "سُبْحَانَ", root: "sbH", rootArabic: "س ب ح", lemma: "سُبْحَان", meaning: "Glory be to" },
					{ wordIndex: 2, text: "رَبِّيَ", root: "rbb", rootArabic: "ر ب ب", lemma: "رَبّ", meaning: "my Lord" },
					{ wordIndex: 3, text: "الْعَظِيمِ", root: "EZm", rootArabic: "ع ظ م", lemma: "عَظِيم", meaning: "the Magnificent" }
				]
			}
		]
	},
	{
		id: "sujood",
		name: "Sujood (Prostration in Prayer)",
		verses: [
			{
				ayah: 1,
				words: [
					{ wordIndex: 1, text: "سُبْحَانَ", root: "sbH", rootArabic: "س ب ح", lemma: "سُبْحَان", meaning: "Glory be to" },
					{ wordIndex: 2, text: "رَبِّيَ", root: "rbb", rootArabic: "ر ب ب", lemma: "رَبّ", meaning: "my Lord" },
					{ wordIndex: 3, text: "الْأَعْلَى", root: "Ely", rootArabic: "ع ل ي", lemma: "أَعْلَى", meaning: "the Most High" }
				]
			}
		]
	},
	{
		id: "salawat",
		name: "Salawat Ibrahimiyyah",
		verses: [
			{
				ayah: 1,
				words: [
					{ wordIndex: 1, text: "اللَّهُمَّ", root: "Alh", rootArabic: "ا ل ه", lemma: "اللَّهُمَّ", meaning: "O Allah" },
					{ wordIndex: 2, text: "صَلِّ", root: "Slw", rootArabic: "ص ل و", lemma: "صَلَّى", meaning: "send blessings / peace" },
					{ wordIndex: 3, text: "عَلَى", root: null, rootArabic: null, lemma: null, meaning: "upon" },
					{ wordIndex: 4, text: "مُحَمَّدٍ", root: "Hmd", rootArabic: "ح م د", lemma: "مُحَمَّد", meaning: "Muhammad" },
					{ wordIndex: 5, text: "وَعَلَى", root: null, rootArabic: null, lemma: null, meaning: "and upon" },
					{ wordIndex: 6, text: "آلِ", root: "Awl", rootArabic: "أ و ل", lemma: "آل", meaning: "family / followers" },
					{ wordIndex: 7, text: "مُحَمَّدٍ", root: "Hmd", rootArabic: "ح م د", lemma: "مُحَمَّد", meaning: "Muhammad" }
				]
			},
			{
				ayah: 2,
				words: [
					{ wordIndex: 1, text: "كَمَا", root: null, rootArabic: null, lemma: null, meaning: "as" },
					{ wordIndex: 2, text: "صَلَّيْتَ", root: "Slw", rootArabic: "ص ل و", lemma: "صَلَّى", meaning: "You sent blessings" },
					{ wordIndex: 3, text: "عَلَى", root: null, rootArabic: null, lemma: null, meaning: "upon" },
					{ wordIndex: 4, text: "إِبْرَاهِيمَ", root: null, rootArabic: null, lemma: null, meaning: "Abraham" },
					{ wordIndex: 5, text: "وَعَلَى", root: null, rootArabic: null, lemma: null, meaning: "and upon" },
					{ wordIndex: 6, text: "آلِ", root: "Awl", rootArabic: "أ و ل", lemma: "آل", meaning: "family" },
					{ wordIndex: 7, text: "إِبْرَاهِيمَ", root: null, rootArabic: null, lemma: null, meaning: "Abraham" }
				]
			},
			{
				ayah: 3,
				words: [
					{ wordIndex: 1, text: "إِنَّكَ", root: null, rootArabic: null, lemma: null, meaning: "Indeed You" },
					{ wordIndex: 2, text: "حَمِيدٌ", root: "Hmd", rootArabic: "ح م د", lemma: "حَمِيد", meaning: "Praiseworthy" },
					{ wordIndex: 3, text: "مَجِيدٌ", root: "mjd", rootArabic: "م ج د", lemma: "مَجِيد", meaning: "Full of Glory / Majestic" }
				]
			},
			{
				ayah: 4,
				words: [
					{ wordIndex: 1, text: "اللَّهُمَّ", root: "Alh", rootArabic: "ا ل ه", lemma: "اللَّهُمَّ", meaning: "O Allah" },
					{ wordIndex: 2, text: "بَارِكْ", root: "brk", rootArabic: "ب ر ك", lemma: "بَارَكَ", meaning: "bless" },
					{ wordIndex: 3, text: "عَلَى", root: null, rootArabic: null, lemma: null, meaning: "upon" },
					{ wordIndex: 4, text: "مُحَمَّدٍ", root: "Hmd", rootArabic: "ح م د", lemma: "مُحَمَّد", meaning: "Muhammad" },
					{ wordIndex: 5, text: "وَعَلَى", root: null, rootArabic: null, lemma: null, meaning: "and upon" },
					{ wordIndex: 6, text: "آلِ", root: "Awl", rootArabic: "أ و ل", lemma: "آل", meaning: "family" },
					{ wordIndex: 7, text: "مُحَمَّدٍ", root: "Hmd", rootArabic: "ح م د", lemma: "مُحَمَّد", meaning: "Muhammad" }
				]
			},
			{
				ayah: 5,
				words: [
					{ wordIndex: 1, text: "كَمَا", root: null, rootArabic: null, lemma: null, meaning: "as" },
					{ wordIndex: 2, text: "بَارَكْتَ", root: "brk", rootArabic: "ب ر ك", lemma: "بَارَكَ", meaning: "You blessed" },
					{ wordIndex: 3, text: "عَلَى", root: null, rootArabic: null, lemma: null, meaning: "upon" },
					{ wordIndex: 4, text: "إِبْرَاهِيمَ", root: null, rootArabic: null, lemma: null, meaning: "Abraham" },
					{ wordIndex: 5, text: "وَعَلَى", root: null, rootArabic: null, lemma: null, meaning: "and upon" },
					{ wordIndex: 6, text: "آلِ", root: "Awl", rootArabic: "أ و ل", lemma: "آل", meaning: "family" },
					{ wordIndex: 7, text: "إِبْرَاهِيمَ", root: null, rootArabic: null, lemma: null, meaning: "Abraham" }
				]
			},
			{
				ayah: 6,
				words: [
					{ wordIndex: 1, text: "إِنَّكَ", root: null, rootArabic: null, lemma: null, meaning: "Indeed You" },
					{ wordIndex: 2, text: "حَمِيدٌ", root: "Hmd", rootArabic: "ح م د", lemma: "حَمِيد", meaning: "Praiseworthy" },
					{ wordIndex: 3, text: "مَجِيدٌ", root: "mjd", rootArabic: "م ج د", lemma: "مَجِيد", meaning: "Full of Glory / Majestic" }
				]
			}
		]
	}
];

export default function RootsExplorer() {
	const [db, setDb] = useState<RootsDatabase | null>(null);
	const [salahDb, setSalahDb] = useState<SalahSurah[] | null>(null);
	const [loading, setLoading] = useState(true);

	// Navigation: "dashboard" | "explorer" | "frequency" | "salah"
	const [activeTab, setActiveTab] = useState<string>("dashboard");

	// Focus study card mode: "recommend" (Next Best Root) | "daily" (Root of the Day)
	const [focusMode, setFocusMode] = useState<"recommend" | "daily">("recommend");

	// Learned roots state
	const [learnedRoots, setLearnedRoots] = useState<Set<string>>(() => {
		const saved = localStorage.getItem("learnedRoots");
		return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
	});

	// Learned roots history (to track chronological order of learning)
	const [learnedHistory, setLearnedHistory] = useState<string[]>(() => {
		const savedHistory = localStorage.getItem("learnedRootsHistory");
		if (savedHistory) return JSON.parse(savedHistory) as string[];
		const savedRoots = localStorage.getItem("learnedRoots");
		return savedRoots ? (JSON.parse(savedRoots) as string[]) : [];
	});

	// Root Explorer states
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedRoot, setSelectedRoot] = useState<RootData | null>(null);
	const [explorerPageSize, setExplorerPageSize] = useState<number>(30);

	// Frequency Explorer states
	const [freqFilter, setFreqFilter] = useState<string>("all"); // "all" | "50" | "100" | "500" | "juz_amma" | "salah"
	const [freqSearch, setFreqSearch] = useState<string>("");
	const [freqSort, setFreqSort] = useState<string>("rank-asc"); // "rank-asc" | "rank-desc" | "alpha-asc" | "learned-first"

	// Salah Explorer states
	const [selectedSalahId, setSelectedSalahId] = useState<number | string>("takbir");
	const [selectedWord, setSelectedWord] = useState<{
		word: SalahWord;
		ayahIndex: number;
		wordIndex: number;
	} | null>(null);

	// Fetch databases and merge
	useEffect(() => {
		async function loadData() {
			try {
				const [rootsRes, salahRes] = await Promise.all([
					fetch("/quran-roots.json"),
					fetch("/salah-data.json"),
				]);
				if (!rootsRes.ok || !salahRes.ok) throw new Error("fetch failed");
				const fetchedRoots = (await rootsRes.json()) as RootsDatabase;
				const fetchedSalah = (await salahRes.json()) as SalahSurah[];

				// Merge fetched salah with liturgical extra sections in order:
				const orderedSalah: SalahSurah[] = [];

				const pushSection = (id: number | string, isExtra: boolean) => {
					if (isExtra) {
						const found = EXTRA_SALAH_SECTIONS.find((x) => x.id === id);
						if (found) orderedSalah.push(found);
					} else {
						const found = fetchedSalah.find((x) => x.id === id);
						if (found) orderedSalah.push(found);
					}
				};

				pushSection("takbir", true);
				pushSection(1, false); // Al-Fatihah
				pushSection("ruku", true);
				pushSection("sujood", true);
				pushSection("tashahhud", false); // Tashahhud from JSON
				pushSection("salawat", true);
				pushSection(112, false); // Al-Ikhlas
				pushSection(113, false); // Al-Falaq
				pushSection(114, false); // An-Nas

				// Append any extra ones just in case
				fetchedSalah.forEach((s) => {
					if (!orderedSalah.some((o) => o.id === s.id)) {
						orderedSalah.push(s);
					}
				});

				setDb(fetchedRoots);
				setSalahDb(orderedSalah);
			} catch {
				/* silently degrade */
			}
			setLoading(false);
		}
		void loadData();
	}, []);

	// Toggle learned status
	const toggleLearned = (rootStr: string) => {
		const next = new Set(learnedRoots);
		let nextHistory = [...learnedHistory];
		if (next.has(rootStr)) {
			next.delete(rootStr);
			nextHistory = nextHistory.filter((x) => x !== rootStr);
		} else {
			next.add(rootStr);
			if (!nextHistory.includes(rootStr)) {
				nextHistory.push(rootStr);
			}
		}
		setLearnedRoots(next);
		setLearnedHistory(nextHistory);
		localStorage.setItem("learnedRoots", JSON.stringify(Array.from(next)));
		localStorage.setItem("learnedRootsHistory", JSON.stringify(nextHistory));
	};

	// Helper to strip diacritics / normalize Arabic for fuzzy matching
	const cleanArabic = (str: string) => {
		return str
			.replace(/[\u064B-\u065F]/g, "") // remove Harakat
			.replace(/[أإآ]/g, "ا") // normalize Alef
			.replace(/\s+/g, "") // remove spaces
			.toLowerCase();
	};

	// Root of the day (seeded by date calendar days)
	const rootOfTheDay = useMemo<RootData | null>(() => {
		if (!db || db.roots.length === 0) return null;
		const todayStr = new Date().toISOString().slice(0, 10);
		let origin = localStorage.getItem("rootsDayOrigin");
		if (!origin) {
			origin = todayStr;
			localStorage.setItem("rootsDayOrigin", origin);
		}
		const elapsed = Math.floor(
			(new Date(todayStr).getTime() - new Date(origin).getTime()) / 86400000,
		);
		// Pick root of the day
		return db.roots[elapsed % db.roots.length];
	}, [db]);

	// Sibling roots matching shared letters (at least 2 letters in common)
	const relatedRoots = useMemo(() => {
		if (!db || !selectedRoot) return [];
		const cleanStr = (r: string) => r.toLowerCase().replace(/[^a-z]/g, "");
		const letters1 = cleanStr(selectedRoot.root).split("");
		if (letters1.length < 2) return [];

		return db.roots
			.filter((r) => {
				if (r.root === selectedRoot.root) return false;
				const letters2 = cleanStr(r.root).split("");
				let sharedCount = 0;
				const tempLetters2 = [...letters2];
				letters1.forEach((char) => {
					const idx = tempLetters2.indexOf(char);
					if (idx !== -1) {
						sharedCount++;
						tempLetters2.splice(idx, 1);
					}
				});
				return sharedCount >= 2;
			})
			.slice(0, 5);
	}, [db, selectedRoot]);

	// Coverage for each salah section: (words with no root + words with root in learned) / total words
	const salahCoverageStats = useMemo(() => {
		if (!salahDb) return [];
		return salahDb.map((section) => {
			let total = 0;
			let known = 0;
			section.verses.forEach((v) => {
				v.words.forEach((w) => {
					total++;
					if (!w.root || learnedRoots.has(w.root)) {
						known++;
					}
				});
			});
			const percent = total > 0 ? Math.round((known / total) * 100) : 0;
			return {
				id: section.id,
				name: section.name,
				percent,
				totalRoots: new Set(
					section.verses
						.flatMap((v) => v.words)
						.map((w) => w.root)
						.filter((r): r is string => r !== null)
				).size,
			};
		});
	}, [salahDb, learnedRoots]);

	// Helper to find the actual Arabic words recited in Salah that match a given root
	const getSalahWordsForRoot = (rootStr: string) => {
		if (!salahDb) return [];
		const results: { text: string; sectionName: string; meaning?: string }[] = [];
		const seen = new Set<string>();
		
		salahDb.forEach(section => {
			section.verses.forEach(v => {
				v.words.forEach(w => {
					if (w.root === rootStr) {
						const cleanText = w.text.trim();
						const key = `${cleanText}-${section.name}`;
						if (!seen.has(key)) {
							seen.add(key);
							results.push({
								text: cleanText,
								sectionName: section.name,
								meaning: w.meaning
							});
						}
					}
				});
			});
		});
		return results;
	};

	// 1. Calculate overall Salah coverage (percentage of known words across all prayer parts)
	const overallSalahCoverage = useMemo(() => {
		if (!salahDb) return 0;
		let total = 0;
		let known = 0;
		salahDb.forEach((section) => {
			section.verses.forEach((v) => {
				v.words.forEach((w) => {
					total++;
					if (!w.root || learnedRoots.has(w.root)) {
						known++;
					}
				});
			});
		});
		return total > 0 ? parseFloat(((known / total) * 100).toFixed(1)) : 0;
	}, [salahDb, learnedRoots]);

	// Qualitative interpretation level based on Salah coverage
	const getSalahCoverageLevel = (coverage: number) => {
		if (coverage < 20) return "Recognizing familiar words";
		if (coverage < 40) return "Understanding key prayer vocabulary";
		if (coverage < 60) return "Following much of the meaning";
		if (coverage < 80) return "Understanding most recited prayers";
		return "Near-complete Salah vocabulary mastery";
	};

	// Last learned details logic to track momentum and show coverage increases
	const lastLearnedDetails = useMemo(() => {
		if (learnedHistory.length === 0 || !db || !salahDb) return null;
		const lastRootStr = learnedHistory[learnedHistory.length - 1];
		const rootItem = db.roots.find((r) => r.root === lastRootStr);
		if (!rootItem) return null;

		// Calculate what Salah coverage was *before* learning this root
		let totalWords = 0;
		let knownWith = 0;
		let knownWithout = 0;
		
		salahDb.forEach((section) => {
			section.verses.forEach((v) => {
				v.words.forEach((w) => {
					totalWords++;
					const hasRoot = w.root !== null;
					if (!hasRoot || learnedRoots.has(w.root!)) {
						knownWith++;
					}
					if (!hasRoot || (learnedRoots.has(w.root!) && w.root !== lastRootStr)) {
						knownWithout++;
					}
				});
			});
		});

		const pctWith = totalWords > 0 ? parseFloat(((knownWith / totalWords) * 100).toFixed(1)) : 0;
		const pctWithout = totalWords > 0 ? parseFloat(((knownWithout / totalWords) * 100).toFixed(1)) : 0;
		const recitedWords = getSalahWordsForRoot(lastRootStr);

		return {
			root: lastRootStr,
			rootArabic: rootItem.rootArabic,
			meaning: rootItem.meaning,
			words: recitedWords,
			pctBefore: pctWithout,
			pctAfter: pctWith,
			increase: parseFloat((pctWith - pctWithout).toFixed(1))
		};
	}, [db, salahDb, learnedRoots, learnedHistory]);

	// 2. Count total unique roots in Salah
	const uniqueSalahRootsCount = useMemo(() => {
		if (!salahDb) return 0;
		const rootsSet = new Set<string>();
		salahDb.forEach(section => {
			section.verses.forEach(v => {
				v.words.forEach(w => {
					if (w.root) rootsSet.add(w.root);
				});
			});
		});
		return rootsSet.size;
	}, [salahDb]);

	// 3. Count learned unique roots in Salah
	const learnedSalahRootsCount = useMemo(() => {
		if (!salahDb) return 0;
		const rootsSet = new Set<string>();
		salahDb.forEach(section => {
			section.verses.forEach(v => {
				v.words.forEach(w => {
					if (w.root && learnedRoots.has(w.root)) {
						rootsSet.add(w.root);
					}
				});
			});
		});
		return rootsSet.size;
	}, [salahDb, learnedRoots]);

	// 4. Calculate individual root gains in overall Salah coverage
	const salahRootGains = useMemo(() => {
		if (!db || !salahDb) return [];
		
		// Total words across all of Salah
		let totalSalahWords = 0;
		salahDb.forEach(section => {
			section.verses.forEach(v => {
				totalSalahWords += v.words.length;
			});
		});
		
		// Map root -> frequency count in entire Salah
		const overallCounts: Record<string, number> = {};
		// Map sectionId -> root -> count in section
		const sectionCounts: Record<string | number, Record<string, number>> = {};
		// Map sectionId -> total words in section
		const sectionTotalWords: Record<string | number, number> = {};

		salahDb.forEach(section => {
			sectionCounts[section.id] = {};
			let sectionWords = 0;
			
			section.verses.forEach(v => {
				sectionWords += v.words.length;
				v.words.forEach(w => {
					if (w.root) {
						overallCounts[w.root] = (overallCounts[w.root] || 0) + 1;
						sectionCounts[section.id][w.root] = (sectionCounts[section.id][w.root] || 0) + 1;
					}
				});
			});
			
			sectionTotalWords[section.id] = sectionWords;
		});

		return db.roots.map(rootItem => {
			const rootStr = rootItem.root;
			const countInSalah = overallCounts[rootStr] || 0;
			const overallGain = totalSalahWords > 0 ? (countInSalah / totalSalahWords) * 100 : 0;
			
			const sectionsAppeared: { sectionId: string | number; sectionName: string; count: number; gain: number }[] = [];
			salahDb.forEach(section => {
				const countInSection = sectionCounts[section.id][rootStr] || 0;
				if (countInSection > 0) {
					const sectTotal = sectionTotalWords[section.id];
					const sectGain = sectTotal > 0 ? (countInSection / sectTotal) * 100 : 0;
					sectionsAppeared.push({
						sectionId: section.id,
						sectionName: section.name,
						count: countInSection,
						gain: sectGain
					});
				}
			});

			return {
				root: rootStr,
				rootArabic: rootItem.rootArabic,
				meaning: rootItem.meaning,
				rank: rootItem.rank,
				occurrences: rootItem.occurrences,
				countInSalah,
				overallGain,
				sectionsAppeared
			};
		});
	}, [db, salahDb]);

	// 5. Unlearned Salah roots sorted by frequency in Salah (highest gain targets)
	const unlearnedSalahGains = useMemo(() => {
		return salahRootGains
			.filter(g => !learnedRoots.has(g.root) && g.countInSalah > 0)
			.sort((a, b) => b.countInSalah - a.countInSalah || a.rank - b.rank);
	}, [salahRootGains, learnedRoots]);

	// 6. Next Best Root: The unlearned root that maximizes Salah coverage (fallback to highest frequency Quran root if all Salah roots are learned)
	const nextBestRoot = useMemo(() => {
		if (unlearnedSalahGains.length > 0) {
			return unlearnedSalahGains[0];
		}
		if (!db) return null;
		const firstUnlearned = db.roots.find(r => !learnedRoots.has(r.root));
		if (!firstUnlearned) return null;
		return {
			root: firstUnlearned.root,
			rootArabic: firstUnlearned.rootArabic,
			meaning: firstUnlearned.meaning,
			rank: firstUnlearned.rank,
			occurrences: firstUnlearned.occurrences,
			countInSalah: 0,
			overallGain: 0,
			sectionsAppeared: [] as { sectionId: string | number; sectionName: string; count: number; gain: number }[]
		};
	}, [unlearnedSalahGains, db, learnedRoots]);

	// Helper to lookup gain statistics for the seed Root of the Day
	const rootOfTheDayGain = useMemo(() => {
		if (!rootOfTheDay) return null;
		return salahRootGains.find(g => g.root === rootOfTheDay.root) || null;
	}, [rootOfTheDay, salahRootGains]);

	// Filtered roots for ROOT EXPLORER
	const explorerFilteredRoots = useMemo(() => {
		if (!db) return [];
		if (!searchQuery.trim()) return db.roots;
		const query = searchQuery.trim().toLowerCase();
		const cleanQuery = cleanArabic(query);

		return db.roots.filter((r) => {
			// Check transliteration
			if (r.root.toLowerCase().includes(query) || r.root.replace(/-/g, "").toLowerCase().includes(query)) return true;
			// Check Arabic characters
			if (cleanArabic(r.rootArabic).includes(cleanQuery)) return true;
			// Check Meaning
			if (r.meaning.toLowerCase().includes(query)) return true;
			// Check Derived Lemmas
			return r.lemmas.some(
				(l) =>
					l.lemma.toLowerCase().includes(query) ||
					cleanArabic(l.lemmaArabic).includes(cleanQuery)
			);
		});
	}, [db, searchQuery]);

	// Paginated subset of Root Explorer list
	const explorerDisplayedRoots = useMemo(() => {
		return explorerFilteredRoots.slice(0, explorerPageSize);
	}, [explorerFilteredRoots, explorerPageSize]);

	// Filtered & sorted roots for FREQUENCY EXPLORER
	const frequencyFilteredRoots = useMemo(() => {
		if (!db || !salahDb) return [];
		let list = [...db.roots];

		// Filter
		if (freqFilter === "50") {
			list = list.filter((r) => r.rank <= 50);
		} else if (freqFilter === "100") {
			list = list.filter((r) => r.rank <= 100);
		} else if (freqFilter === "500") {
			list = list.filter((r) => r.rank <= 500);
		} else if (freqFilter === "juz_amma") {
			list = list.filter(
				(r) => r.sampleVerses?.some((v) => v.surah >= 78 && v.surah <= 114) ?? false,
			);
		} else if (freqFilter === "salah") {
			list = list.filter((r) =>
				salahDb.some((s) =>
					s.verses.some((v) => v.words.some((w) => w.root === r.root))
				)
			);
		}

		// Text Search Filter
		if (freqSearch.trim()) {
			const query = freqSearch.trim().toLowerCase();
			const cleanQuery = cleanArabic(query);
			list = list.filter(
				(r) =>
					r.root.toLowerCase().includes(query) ||
					cleanArabic(r.rootArabic).includes(cleanQuery) ||
					r.meaning.toLowerCase().includes(query),
			);
		}

		// Sorting
		if (freqSort === "rank-asc") {
			list.sort((a, b) => a.rank - b.rank);
		} else if (freqSort === "rank-desc") {
			list.sort((a, b) => b.rank - a.rank);
		} else if (freqSort === "alpha-asc") {
			list.sort((a, b) => a.root.localeCompare(b.root));
		} else if (freqSort === "learned-first") {
			list.sort((a, b) => {
				const aL = learnedRoots.has(a.root) ? 1 : 0;
				const bL = learnedRoots.has(b.root) ? 1 : 0;
				if (aL !== bL) return bL - aL; // learned first
				return a.rank - b.rank; // tie breaker rank
			});
		}

		return list;
	}, [db, salahDb, freqFilter, freqSearch, freqSort, learnedRoots]);

	// Active Salah Explorer surah / text
	const activeSalahSurah = useMemo(
		() => salahDb?.find((s) => s.id === selectedSalahId) ?? salahDb?.[0] ?? null,
		[salahDb, selectedSalahId],
	);

	// Selected word root details lookup
	const selectedWordRootDetails = useMemo(() => {
		if (!db || !selectedWord?.word.root) return null;
		return db.roots.find((r) => r.root === selectedWord.word.root) ?? null;
	}, [db, selectedWord]);

	// Navigate helper to search and select root in Root Explorer
	const jumpToRootExplorer = (rootStr: string) => {
		if (!db) return;
		const found = db.roots.find((r) => r.root === rootStr);
		if (found) {
			setSelectedRoot(found);
			setSearchQuery(found.rootArabic);
			setActiveTab("explorer");
		}
	};

	if (loading) return <div className="roots-loading">Loading Qur'an Roots Database…</div>;
	if (!db || !salahDb) return <div className="roots-error">Could not initialize roots data.</div>;

	return (
		<div className="app-layout">
			{/* Tab Switcher Navigation */}
			<div className="tab-navigation">
				<button
					type="button"
					className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
					onClick={() => setActiveTab("dashboard")}
				>
					<span className="tab-icon">📊</span>
					<span className="tab-label">Dashboard</span>
				</button>
				<button
					type="button"
					className={`tab-btn ${activeTab === "explorer" ? "active" : ""}`}
					onClick={() => {
						setActiveTab("explorer");
						setSearchQuery("");
						setExplorerPageSize(30);
					}}
				>
					<span className="tab-icon">🔍</span>
					<span className="tab-label">Root Explorer</span>
				</button>
				<button
					type="button"
					className={`tab-btn ${activeTab === "frequency" ? "active" : ""}`}
					onClick={() => setActiveTab("frequency")}
				>
					<span className="tab-icon">📈</span>
					<span className="tab-label">Frequency Explorer</span>
				</button>
				<button
					type="button"
					className={`tab-btn ${activeTab === "salah" ? "active" : ""}`}
					onClick={() => {
						setActiveTab("salah");
						setSelectedWord(null);
					}}
				>
					<span className="tab-icon">🕌</span>
					<span className="tab-label">Salah Explorer</span>
				</button>
			</div>

			{/* Render Active View */}
			<div className="tab-viewport">
				{/* TAB 1: DASHBOARD */}
				{activeTab === "dashboard" && (
					<div className="tab-content dashboard-tab">
						{/* Dashboard Header Info */}
						<div className="dashboard-header-container">
							<h2>Understand what you recite in Salah.</h2>
							<p>Study by impact. Focus on the roots that optimize your daily Salah comprehension first.</p>
						</div>

						{/* Three-Column Dashboard Grid Layout */}
						<div className="dashboard-grid-layout">
							{/* Left Column: Interactive Study Focus Card */}
							<div className="hero-focus-card card-box">
								<div className="focus-card-header">
									<span className="focus-card-title">🎯 Current Study Target</span>
									<div className="focus-toggle-switch">
										<button
											type="button"
											className={`focus-toggle-btn ${focusMode === "recommend" ? "active" : ""}`}
											onClick={() => setFocusMode("recommend")}
										>
											Recommended Target
										</button>
										<button
											type="button"
											className={`focus-toggle-btn ${focusMode === "daily" ? "active" : ""}`}
											onClick={() => setFocusMode("daily")}
										>
											Root of the Day
										</button>
									</div>
								</div>

								{(() => {
									const activeRoot = focusMode === "recommend" ? nextBestRoot : rootOfTheDayGain;
									if (!activeRoot) {
										return (
											<div className="empty-message" style={{ padding: "40px 20px", textAlign: "center" }}>
												🎉 SubhanAllah! You have learned all vocabulary roots in the system!
											</div>
										);
									}

									const isLearned = learnedRoots.has(activeRoot.root);
									const recitedWords = getSalahWordsForRoot(activeRoot.root);

									return (
										<div className="focus-card-body">
											<div className="focus-root-display">
												<span className="focus-root-arabic">{activeRoot.rootArabic}</span>
												<span className="focus-root-translit">{activeRoot.root}</span>
												<span className="focus-root-translit" style={{ fontSize: '0.75rem', opacity: 0.6 }}>Rank #{activeRoot.rank}</span>
											</div>

											<div className="focus-root-details">
												<div className="focus-root-meaning">"{activeRoot.meaning || "—"}"</div>

												<div className="focus-root-stats-row">
													<span>Occurrences: {activeRoot.occurrences}× in Qur'an</span>
												</div>

												{/* Recitations inside prayers */}
												{recitedWords.length > 0 ? (
													<div className="focus-root-recitations">
														<div className="focus-recitation-title">You recite this in:</div>
														<div className="focus-recitation-words">
															{recitedWords.slice(0, 5).map((w, idx) => (
																<span key={`${w.text}-${idx}`} className="focus-word-pill">
																	{w.text}
																</span>
															))}
															<span className="focus-section-link">
																in {activeRoot.sectionsAppeared.map(s => s.sectionName).join(", ")}
															</span>
														</div>
													</div>
												) : (
													<div className="focus-root-recitations">
														<div className="focus-recitation-title">Linguistic Context:</div>
														<span className="focus-section-link">Does not occur in prayers directly, but builds general Qur'anic vocabulary.</span>
													</div>
												)}

												{/* Dynamic Expected Gain readout */}
												{activeRoot.countInSalah > 0 ? (
													<div className="focus-impact-gain">
														<span className="focus-gain-percent">
															{isLearned ? "✓" : `+${activeRoot.overallGain.toFixed(1)}%`}
														</span>
														<span>
															{isLearned 
																? "Salah coverage boost secured!" 
																: `boost to overall Salah coverage upon learning.`}
														</span>
													</div>
												) : (
													<div className="focus-impact-gain no-gain">
														<span>Focuses on general Quranic comprehension.</span>
													</div>
												)}

												<div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
													<button
														type="button"
														className={`focus-learn-btn ${isLearned ? "learned" : ""}`}
														onClick={() => toggleLearned(activeRoot.root)}
													>
														{isLearned ? "✓ Learned" : "Mark as Learned"}
													</button>
													<button
														type="button"
														className="table-action-btn"
														onClick={() => jumpToRootExplorer(activeRoot.root)}
													>
														Morphology →
													</button>
												</div>
											</div>
										</div>
									);
								})()}
							</div>

							{/* Middle Column: Last Learned Momentum Card */}
							<div className="last-learned-card card-box">
								<div className="last-learned-header">
									<span className="last-learned-title">⚡ Last Learned Root</span>
								</div>
								
								{lastLearnedDetails ? (
									<div className="last-learned-body">
										<div className="last-root-display">
											<div className="last-root-arabic-group">
												<span className="last-root-arabic">{lastLearnedDetails.rootArabic}</span>
												<span className="last-root-translit">({lastLearnedDetails.root})</span>
											</div>
											<div className="last-root-meaning">"{lastLearnedDetails.meaning}"</div>
										</div>

										<div className="last-learned-words-box">
											<div className="last-learned-words-title">You now understand:</div>
											{lastLearnedDetails.words.length > 0 ? (
												<div className="last-learned-words-flex">
													{lastLearnedDetails.words.slice(0, 3).map((w, idx) => (
														<div key={`${w.text}-${idx}`} className="last-word-item">
															<span className="last-word-check">✓</span>
															<span className="last-word-text">{w.text}</span>
															<span className="last-word-translation">({w.meaning})</span>
														</div>
													))}
													{lastLearnedDetails.words.length > 3 && (
														<span className="more-words-badge">+{lastLearnedDetails.words.length - 3} more</span>
													)}
												</div>
											) : (
												<div className="last-learned-general-msg">
													✓ Expands general Quranic vocabulary
												</div>
											)}
										</div>

										<div className="last-learned-coverage-shift">
											<span className="shift-label">Salah coverage increased:</span>
											<div className="shift-values">
												<span className="shift-val-before">{lastLearnedDetails.pctBefore}%</span>
												<span className="shift-arrow">→</span>
												<span className="shift-val-after success">{lastLearnedDetails.pctAfter}%</span>
												{lastLearnedDetails.increase > 0 && (
													<span className="shift-gain-badge">+{lastLearnedDetails.increase}%</span>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="last-learned-placeholder">
										<div className="placeholder-icon">🌱</div>
										<h4>Your Momentum</h4>
										<p>Mark your first root as learned from the Study Target to activate your momentum tracker here.</p>
									</div>
								)}
							</div>

							{/* Right Column: Path to Understanding Your Salah progress & stats */}
							<div className="card-box hero-progress-panel">
								<div className="progress-header">
									<h3>Path to Understanding Your Salah</h3>
									<p>Progress towards mastering daily prayers</p>
								</div>

								<div className="circular-progress-hero">
									<div className="circular-progress-container" style={{ width: "110px", height: "110px" }}>
										<svg viewBox="0 0 100 100" className="progress-ring">
											<circle className="progress-ring-bg" cx="50" cy="50" r="40" />
											<circle
												className="progress-ring-fill"
												cx="50"
												cy="50"
												r="40"
												style={{
													strokeDasharray: 251.2,
													strokeDashoffset: 251.2 - (251.2 * overallSalahCoverage) / 100,
												}}
											/>
										</svg>
										<div className="progress-text">
											<span className="progress-num">{overallSalahCoverage}%</span>
											<span className="progress-lbl">Salah Coverage</span>
										</div>
									</div>
								</div>

								<div className="progress-level-badge">
									<span className="level-lbl">Level</span>
									<span className="level-val">{getSalahCoverageLevel(overallSalahCoverage)}</span>
								</div>

								<div className="salah-path-overview">
									<div className="path-metric-item">
										<span className="path-metric-val">{uniqueSalahRootsCount}</span>
										<span className="path-metric-lbl">roots total</span>
									</div>
									<div className="path-metric-item success">
										<span className="path-metric-val">{learnedSalahRootsCount}</span>
										<span className="path-metric-lbl">learned</span>
									</div>
									<div className="path-metric-item warning">
										<span className="path-metric-val">{uniqueSalahRootsCount - learnedSalahRootsCount}</span>
										<span className="path-metric-lbl">remaining</span>
									</div>
								</div>
							</div>
						</div>

						{/* Bottom Area: Optimization targets table & Breakdown */}
						<div className="optimizations-section">
							<div className="optimizations-grid">
								{/* Optimization Target Roots Table */}
								<div className="card-box">
									<h3 className="section-title">🚀 Next Best Targets to Learn</h3>
									<p className="section-subtitle">Maximize your daily prayer understanding by learning these roots next:</p>

									<div className="salah-gain-table-wrapper">
										<table className="salah-gain-table">
											<thead>
												<tr>
													<th>Root</th>
													<th>Meaning</th>
													<th>Appears In</th>
													<th style={{ textAlign: "right" }}>Salah Coverage Gain</th>
													<th style={{ textAlign: "right" }}>Actions</th>
												</tr>
											</thead>
											<tbody>
												{unlearnedSalahGains.slice(0, 10).map((g) => {
													return (
														<tr key={g.root}>
															<td>
																<div className="gain-table-root-cell">
																	<span className="gain-table-arabic">{g.rootArabic}</span>
																	<span className="gain-table-translit">({g.root})</span>
																</div>
															</td>
															<td>
																<div className="gain-table-meaning" title={g.meaning}>
																	{g.meaning}
																</div>
															</td>
															<td>
																<span className="focus-section-link">
																	{g.sectionsAppeared.map(s => s.sectionName).join(", ")}
																</span>
															</td>
															<td style={{ textAlign: "right" }}>
																<span className="gain-table-badge">+{g.overallGain.toFixed(1)}%</span>
															</td>
															<td style={{ textAlign: "right" }}>
																<div style={{ display: "inline-flex", gap: "8px" }}>
																	<button
																		type="button"
																		className="table-action-btn"
																		onClick={() => toggleLearned(g.root)}
																	>
																		Learn
																	</button>
																	<button
																		type="button"
																		className="table-action-btn"
																		onClick={() => jumpToRootExplorer(g.root)}
																		style={{ opacity: 0.8 }}
																	>
																		🔍
																	</button>
																</div>
															</td>
														</tr>
													);
												})}
												{unlearnedSalahGains.length === 0 && (
													<tr>
														<td colSpan={5} className="table-empty" style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
															🎉 SubhanAllah! You have learned all roots that appear in your daily prayers!
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>

								{/* Salah Sections Breakdown Grid */}
								<div className="dashboard-section card-box">
									<h3 className="section-title">🕌 Salah Sections Breakdown</h3>
									<p className="section-subtitle">Select any prayer section to open its interactive reader in Salah Explorer:</p>

									<div className="salah-coverage-list">
										{salahCoverageStats.map((section) => (
											<div
												key={section.id}
												className="salah-coverage-item"
												onClick={() => {
													setSelectedSalahId(section.id);
													setSelectedWord(null);
													setActiveTab("salah");
												}}
											>
												<div className="salah-item-info">
													<span className="salah-item-name">{section.name}</span>
													<span className="salah-item-stat">{section.percent}% coverage ({section.totalRoots} roots)</span>
												</div>
												<div className="salah-progress-track">
													<div
														className="salah-progress-fill"
														style={{
															width: `${section.percent}%`,
															background: section.percent === 100
																? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
																: "linear-gradient(90deg, var(--gold-soft) 0%, #f1d56e 100%)"
														}}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 2: ROOT EXPLORER */}
				{activeTab === "explorer" && (
					<div className="tab-content explorer-tab">
						<div className="search-bar-container">
							<input
								type="text"
								className="search-input"
								placeholder="Search by Root (e.g. rHm, ك ب ر), Arabic word, translation..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setExplorerPageSize(30);
								}}
							/>
							{searchQuery && (
								<button
									type="button"
									className="search-clear-btn"
									onClick={() => {
										setSearchQuery("");
										setExplorerPageSize(30);
									}}
								>
									✕
								</button>
							)}
						</div>

						<div className="explorer-layout-grid">
							{/* Left Column: Search Results List */}
							<div className="explorer-list-pane">
								<h4 className="pane-title">Roots ({explorerFilteredRoots.length})</h4>
								<div className="explorer-roots-list">
									{explorerDisplayedRoots.map((r) => {
										const active = selectedRoot?.root === r.root;
										const learned = learnedRoots.has(r.root);
										return (
											<div
												key={r.root}
												className={`explorer-root-item ${active ? "active" : ""} ${learned ? "learned" : ""}`}
												onClick={() => setSelectedRoot(r)}
											>
												<div className="item-arabic">{r.rootArabic}</div>
												<div className="item-details">
													<div className="item-header">
														<span className="item-translit">{r.root}</span>
														<span className="item-rank">#{r.rank}</span>
													</div>
													<div className="item-meaning">{r.meaning}</div>
												</div>
												<div className="item-badge-container">
													<span className="item-count-badge">{r.occurrences}×</span>
													{learned && <span className="learned-dot">✓</span>}
												</div>
											</div>
										);
									})}
									{explorerFilteredRoots.length === 0 && (
										<div className="empty-message">No matching roots found.</div>
									)}
									{explorerFilteredRoots.length > explorerPageSize && (
										<button
											type="button"
											className="load-more-btn"
											onClick={() => setExplorerPageSize((prev) => prev + 30)}
										>
											Load More...
										</button>
									)}
								</div>
							</div>

							{/* Right Column: Detailed View */}
							<div className="explorer-detail-pane">
								{selectedRoot ? (
									<div className="root-detail-card card-box">
										<div className="detail-header">
											<div className="detail-header-text">
												<span className="detail-rank">Rank #{selectedRoot.rank} · {selectedRoot.occurrences}× in Quran</span>
												<h2 className="detail-title-arabic">{selectedRoot.rootArabic}</h2>
												<div className="detail-subtitle">{selectedRoot.root} (meaning: "{selectedRoot.meaning}")</div>
											</div>
											<button
												type="button"
												className={`detail-learn-toggle-btn ${learnedRoots.has(selectedRoot.root) ? "learned" : ""}`}
												onClick={() => toggleLearned(selectedRoot.root)}
											>
												{learnedRoots.has(selectedRoot.root) ? "✓ Learned" : "☆ Learn Root"}
											</button>
										</div>

										{/* Lemmas Family */}
										<div className="detail-section">
											<h4 className="detail-sec-title">Derived Word Family (Lemmas)</h4>
											<div className="detail-lemmas-list">
												{selectedRoot.lemmas.map((l) => (
													<div key={l.lemma} className="lemma-card">
														<span className="lemma-ar">{l.lemmaArabic}</span>
														<span className="lemma-en">{l.lemma}</span>
														<span className="lemma-ct">{l.count} occurrences</span>
													</div>
												))}
												{selectedRoot.lemmas.length === 0 && <p className="empty-small">No distinct lemmas cataloged.</p>}
											</div>
										</div>

										{/* Sibling / Related Roots */}
										<div className="detail-section">
											<h4 className="detail-sec-title">Linguistic Siblings (Related Roots)</h4>
											<p className="detail-sec-desc">Roots sharing at least two consonant letters (phonetic overlaps):</p>
											<div className="related-roots-list">
												{relatedRoots.map((rr) => (
													<button
														key={rr.root}
														type="button"
														className="related-root-btn"
														onClick={() => setSelectedRoot(rr)}
													>
														<span className="rr-ar">{rr.rootArabic}</span>
														<span className="rr-translit">{rr.root}</span>
														<span className="rr-mean" title={rr.meaning}>{rr.meaning}</span>
													</button>
												))}
												{relatedRoots.length === 0 && <p className="empty-small">No siblings found sharing 2 letters.</p>}
											</div>
										</div>

										{/* Example Verses */}
										<div className="detail-section">
											<h4 className="detail-sec-title">Example Quranic Verses</h4>
											<div className="example-verses-list">
												{selectedRoot.sampleVerses && selectedRoot.sampleVerses.length > 0 ? (
													selectedRoot.sampleVerses.map((v, index) => (
														<a
															key={`${v.surah}-${v.ayah}-${index}`}
															href={`https://quran.com/${v.surah}/${v.ayah}`}
															target="_blank"
															rel="noreferrer"
															className="verse-ref-link"
														>
															📖 Surah {v.surah}, Ayah {v.ayah} <span className="arrow">↗</span>
														</a>
													))
												) : (
													<span className="empty-small">No sample verses loaded.</span>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="root-detail-placeholder card-box">
										<span className="placeholder-icon">🔍</span>
										<h3>Select a Root</h3>
										<p>Click on any root in the list or search above to view derived word families, sibling relationships, and example verses.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* TAB 3: FREQUENCY EXPLORER */}
				{activeTab === "frequency" && (
					<div className="tab-content frequency-tab card-box">
						<div className="freq-header-controls">
							{/* Filter Selector */}
							<div className="filter-group">
								<button
									type="button"
									className={`filter-tab ${freqFilter === "all" ? "active" : ""}`}
									onClick={() => setFreqFilter("all")}
								>
									All ({db.roots.length})
								</button>
								<button
									type="button"
									className={`filter-tab ${freqFilter === "50" ? "active" : ""}`}
									onClick={() => setFreqFilter("50")}
								>
									Top 50
								</button>
								<button
									type="button"
									className={`filter-tab ${freqFilter === "100" ? "active" : ""}`}
									onClick={() => setFreqFilter("100")}
								>
									Top 100
								</button>
								<button
									type="button"
									className={`filter-tab ${freqFilter === "500" ? "active" : ""}`}
									onClick={() => setFreqFilter("500")}
								>
									Top 500
								</button>
								<button
									type="button"
									className={`filter-tab ${freqFilter === "juz_amma" ? "active" : ""}`}
									onClick={() => setFreqFilter("juz_amma")}
								>
									Juz Amma
								</button>
								<button
									type="button"
									className={`filter-tab ${freqFilter === "salah" ? "active" : ""}`}
									onClick={() => setFreqFilter("salah")}
								>
									Salah Roots
								</button>
							</div>

							{/* Sort Controls */}
							<div className="sort-group select-wrapper">
								<select
									aria-label="Sort roots"
									value={freqSort}
									onChange={(e) => setFreqSort(e.target.value)}
								>
									<option value="rank-asc">Frequency: High to Low</option>
									<option value="rank-desc">Frequency: Low to High</option>
									<option value="alpha-asc">Alphabetical (Root A-Z)</option>
									<option value="learned-first">Learned Status First</option>
								</select>
							</div>
						</div>

						{/* Inline search bar in Frequency Explorer */}
						<div className="freq-search-row">
							<input
								type="text"
								className="freq-search-input"
								placeholder="Search roots inside filter..."
								value={freqSearch}
								onChange={(e) => setFreqSearch(e.target.value)}
							/>
						</div>

						{/* Data Table */}
						<div className="table-responsive">
							<table className="freq-table">
								<thead>
									<tr>
										<th>Rank</th>
										<th>Root (Arabic)</th>
										<th>Root (Translit)</th>
										<th>Occurrences</th>
										<th>Core Meaning</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{frequencyFilteredRoots.map((r) => {
										const learned = learnedRoots.has(r.root);
										return (
											<tr
												key={r.root}
												className={`table-row-clickable ${learned ? "row-learned" : ""}`}
												onClick={() => jumpToRootExplorer(r.root)}
											>
												<td className="col-rank">#{r.rank}</td>
												<td className="col-root-ar">{r.rootArabic}</td>
												<td className="col-root-en">{r.root}</td>
												<td className="col-occurrences">{r.occurrences}</td>
												<td className="col-meaning">{r.meaning}</td>
												<td className="col-status">
													<button
														type="button"
														className={`status-star-btn ${learned ? "learned" : ""}`}
														onClick={(e) => {
															e.stopPropagation();
															toggleLearned(r.root);
														}}
													>
														{learned ? "★" : "☆"}
													</button>
												</td>
											</tr>
										);
									})}
									{frequencyFilteredRoots.length === 0 && (
										<tr>
											<td colSpan={6} className="table-empty">No matching roots.</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 4: SALAH EXPLORER */}
				{activeTab === "salah" && (
					<div className="tab-content salah-tab">
						<div className="salah-layout-grid">
							{/* Left Column: Text Reader */}
							<div className="salah-reader-card card-box">
								<div className="salah-reader-header">
									<h3>🕌 Salah Explorer</h3>
									<div className="select-wrapper">
										<select
											aria-label="Select prayer section"
											value={selectedSalahId}
											onChange={(e) => {
												const val = e.target.value;
												setSelectedSalahId(isNaN(Number(val)) ? val : Number(val));
												setSelectedWord(null);
											}}
										>
											{salahDb.map((s) => (
												<option key={s.id} value={s.id}>{s.name}</option>
											))}
										</select>
									</div>
								</div>

								{activeSalahSurah && (
									<div className="salah-text-pane">
										{activeSalahSurah.verses.map((verse, vIdx) => (
											<div key={verse.ayah} className="salah-verse-line">
												<span className="verse-bracket">﴿{verse.ayah}﴾</span>
												<div className="salah-words-flex">
													{verse.words.map((word, wIdx) => {
														const isActive =
															selectedWord?.ayahIndex === vIdx && selectedWord?.wordIndex === wIdx;
														const hasRoot = word.root !== null;
														const isLearned = hasRoot && word.root && learnedRoots.has(word.root);

														let statusClass = "";
														if (!hasRoot) {
															statusClass = "particle-word";
														} else if (isLearned) {
															statusClass = "learned-word";
														}

														return (
															<span
																key={`${word.wordIndex ?? wIdx}-${word.text}`}
																className={`salah-word-span ${isActive ? "active" : ""} ${statusClass}`}
																onClick={() =>
																	setSelectedWord({ word, ayahIndex: vIdx, wordIndex: wIdx })
																}
															>
																{word.text}
															</span>
														);
													})}
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Right Column: Clicked Word Details */}
							<div className="salah-word-details-pane card-box">
								{selectedWord ? (
									<div className="wd-details-wrapper">
										<div className="wd-word-title-row">
											<span className="wd-selected-ar">{selectedWord.word.text}</span>
											{selectedWord.word.root ? (
												<span
													className="wd-root-badge clickable-root"
													onClick={() => selectedWord.word.root && jumpToRootExplorer(selectedWord.word.root)}
													title="Click to explore root details"
												>
													Root: {selectedWord.word.rootArabic} ({selectedWord.word.root})
												</span>
											) : (
												<span className="wd-root-badge particle-badge">Grammar Particle</span>
											)}
										</div>

										<div className="wd-body-content">
											<div className="wd-field">
												<label className="wd-label">English Translation</label>
												<p className="wd-val-translation">
													{selectedWord.word.meaning || selectedWordRootDetails?.meaning || "Meaning dictionary reference."}
												</p>
											</div>

											{selectedWord.word.root && selectedWordRootDetails ? (
												<>
													<div className="wd-field">
														<label className="wd-label">Consonant Root Info</label>
														<p className="wd-val-root">
															The triliteral root <strong>{selectedWord.word.rootArabic}</strong> has <strong>{selectedWordRootDetails.occurrences}</strong> occurrences in the Qur'an and is ranked <strong>#{selectedWordRootDetails.rank}</strong> in overall frequency.
														</p>
													</div>

													<div className="wd-field">
														<label className="wd-label">Learned status</label>
														<button
															type="button"
															className={`wd-learn-action-btn ${learnedRoots.has(selectedWord.word.root) ? "learned" : ""}`}
															onClick={() => selectedWord.word.root && toggleLearned(selectedWord.word.root)}
														>
															{learnedRoots.has(selectedWord.word.root) ? "✓ Learned root" : "☆ Learn this root"}
														</button>
													</div>

													<div className="wd-field">
														<label className="wd-label">Morphological Family (Other words in Quran)</label>
														<p className="wd-lemma-tip">Discover family connections! All these words share the root <strong>{selectedWord.word.rootArabic}</strong>:</p>
														<div className="wd-family-lemmas-grid">
															{selectedWordRootDetails.lemmas.slice(0, 6).map((l) => (
																<div key={l.lemma} className="wd-lemma-badge">
																	<span className="lemma-ar">{l.lemmaArabic}</span>
																	<span className="lemma-count">{l.count}×</span>
																</div>
															))}
														</div>
													</div>

													<button
														type="button"
														className="wd-full-morphology-btn"
														onClick={() => selectedWord.word.root && jumpToRootExplorer(selectedWord.word.root)}
													>
														Explore full root dictionary entry →
													</button>
												</>
											) : (
												<div className="particle-info-box">
													<p>This word is a grammatical particle, conjunction, or proper noun and does not stem from a triliteral root. Particles are building blocks of grammar and are memorized directly.</p>
												</div>
											)}
										</div>
									</div>
								) : (
									<div className="wd-placeholder">
										<span className="placeholder-icon">🕌</span>
										<h3>Salah Explorer</h3>
										<p>Click on any word in the prayer reader on the left to see its translation, triliteral root, frequency, and family sibling words.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
