// War Room Files' real numbers (Business Suite, 18 Nov 2026), used for store screenshots.
// [title, date, views, 3-second hold %, avg play s, interactions per 1k]
const DEMO_ROWS = [
  ["Why jet drones are Ukraine's new problem", '13 November 21:40', 6522, 51, 9, 3.7],
  ['1,198 drones downed. A refinery on fire', '14 November 11:48', 6164, 54, 12, 11.7],
  ['Why Ukraine flew drones to Siberia', '13 November 15:00', 4432, 52, 10, 14.0],
  ['They talked peace. Then night fell.', '11 November 21:45', 1344, 56, 13, 17.9],
  ['Ukraine says it hit Russia 1,000 km deep', '16 November 14:00', 1179, 52, 8, 59.4],
  ["The country Russia's missiles crossed", '15 November 15:00', 1131, 47, 7, 9.7],
  ["Why Russia turns off Ukraine's lights", '9 November 19:00', 1118, 37, 10, 7.2],
  ["Can Ukraine's drone hunters keep up?", '16 November 18:00', 812, 54, 9, 3.7],
  ["21 miles of water is choking the world's oil", '10 November 09:00', 739, 31, 5, 4.1],
  ['The night America nuked itself', '16 November 08:00', 497, 54, 9, 6.0],
  ["Ukraine says it hit Russia's jet test base", '16 November 22:00', 471, 49, 7, 12.7],
  ['The science rocket that nearly started a war', '16 November 02:00', 376, 44, 11, 0.0],
  ["Russia just counted its biggest night", '17 November 13:00', 278, 37, 7, 3.6],
  ["How much of Russia's oil is offline?", '17 November 16:00', 276, 28, 5, 0],
  ["Putin's bridge to Crimea, hit once more", '17 November 19:00', 271, 29, 5, 3.7],
  ['The tape that faked a Soviet nuke strike', '17 November 22:00', 254, 28, 4, 3.9],
  ["Crimea's bridge, then two of Kyiv's", '18 November 12:00', 244, 30, 5, 4.1],
  ['The "easy part" of peace? Not once.', '12 November 18:00', 242, 31, 7, 0],
  ['The vote that stopped a nuclear torpedo', '17 November 10:00', 241, 31, 5, 4.1],
  ['Hungary just stopped its trains to Ukraine', '18 November 08:00', 232, 21, 5, 4.3],
  ['The H-bomb America lost in the sea', '17 November 04:00', 224, 33, 4, 0],
];
// Daily Page follows (Results page), day starts in epoch seconds.
const DEMO_FOLLOWS = [[1794211200, 4], [1794297600, 1], [1794384000, 1], [1794470400, 0], [1794556800, 2], [1794643200, 18], [1794729600, 1], [1794816000, 5], [1794902400, 0]];

function demoState() {
  const now = new Date(2026, 10, 18, 16, 0);
  const reels = {};
  for (const [title, dateText, views, hold, avgPlay, ipk] of DEMO_ROWS) {
    const key = title + '|' + dateText;
    reels[key] = { key, title, type: 'Reel', dateText, published: RI.parseDate(dateText, now), views, viewers: Math.round(views * 0.9),
      views3s: Math.round((views * hold) / 100), avgPlay, interactions: Math.round((views * ipk) / 1000), follows: 0 };
  }
  const follows = {};
  for (const [ts, v] of DEMO_FOLLOWS) follows[ts * 1000] = v;
  return { reels, follows, views: {}, updated: now.getTime() };
}
