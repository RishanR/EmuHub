// Script that can be used to convert an array of Objects to a hashmap by a specific prop in each object of the array

const result = dsReleases_db_json.game.reduce((map, obj) => {
  let name;
  if (Object.prototype.toString.call(obj.locale) == '[object Array]') {
    name = obj.locale[0].title;
  } else {
    name = obj.locale.title;
  }
  map[obj.id] = { name, region: obj.region, languages: obj.languages };
  return map;
}, {});

fs.writeFileSync(
  getAssetPath('dsReleasesHashMap.json'),
  JSON.stringify(result)
);
