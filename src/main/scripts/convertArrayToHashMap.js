// Script that can be used to convert an array of Objects to a hashmap by a specific prop in each object of the array

const result = gbaReleases_db_json.software.reduce((map, obj) => {
  let entries = {};
  let codes = obj.info['@value'].split(', ');
  for (const code of codes) {
    map[code.substring(code.indexOf('-') + 1, code.indexOf('-') + 5)] = {
      name: obj.description,
    };
  }
  return map;
}, {});

fs.writeFileSync(
  getAssetPath('gbaReleasesHashMap.json'),
  JSON.stringify(result)
);
