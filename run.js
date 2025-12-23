const fs = require('fs');
const path = require('path');

const payload = JSON.parse(process.env.GITHUB_EVENT_PATH);
const comment = payload.comment;
const issue = payload.issue;

const TARGET_ISSUE = 'https://github.com/netgoat-xyz/wall-of-names/issues/1';
if(issue.html_url !== TARGET_ISSUE) {
  console.log("Not the target issue, skipping...");
  process.exit(0);
}

const username = comment.user.login;
const commentBody = comment.body.replace(/\r\n/g,'\n');
const date = new Date(comment.created_at).toISOString().split('T')[0];

const userDir = path.join('people', username);
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

const filePath = path.join(userDir, `${date}.txt`);
fs.appendFileSync(filePath, commentBody + '\n\n');

// Update README
const readmePath = 'README.md';
let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '';
let peopleList = [];

const peopleDir = path.join('people');
if (fs.existsSync(peopleDir)) {
  peopleList = fs.readdirSync(peopleDir).filter(f => fs.lstatSync(path.join(peopleDir, f)).isDirectory());
  peopleList.sort((a,b)=> a.localeCompare(b,'en',{sensitivity:'base'}));
}

// Replace list in README between markers
const startMarker = '<!-- PEOPLE_LIST_START -->';
const endMarker = '<!-- PEOPLE_LIST_END -->';
const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`, 'm');

const newList = `${startMarker}\n${peopleList.join('\n')}\n${endMarker}`;
if(readme.match(regex)){
  readme = readme.replace(regex, newList);
} else {
  readme += '\n\n' + newList;
}

fs.writeFileSync(readmePath, readme, 'utf-8');
