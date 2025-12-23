const fs = require('fs');
const path = require('path');

// Read GitHub event JSON
const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error("GITHUB_EVENT_PATH is not set");
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(eventPath, 'utf-8'));

const comment = payload.comment;
const issue = payload.issue;

const TARGET_ISSUE = 'https://github.com/netgoat-xyz/wall-of-names/issues/1';
if (issue.html_url !== TARGET_ISSUE) {
  console.log("Not the target issue, skipping...");
  process.exit(0);
}

// Prepare user folder and file
const username = comment.user.login;
const commentBody = comment.body.replace(/\r\n/g, '\n').trim();
const date = new Date(comment.created_at).toISOString().split('T')[0];

const userDir = path.join('people', username);
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

const filePath = path.join(userDir, `${date}.txt`);
fs.appendFileSync(filePath, commentBody + '\n');

// Update README
const readmePath = 'README.md';
let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '';
let peopleList = [];

const peopleDir = path.join('people');
if (fs.existsSync(peopleDir)) {
  peopleList = fs.readdirSync(peopleDir).filter(f => fs.lstatSync(path.join(peopleDir, f)).isDirectory());
  peopleList.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

// Replace list in README between markers
const startMarker = '<!-- PEOPLE_LIST_START -->';
const endMarker = '<!-- PEOPLE_LIST_END -->';
const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`, 'm');

const newList = `${startMarker}\n${peopleList.join('  \n')}\n${endMarker}`;
if (readme.match(regex)) {
  readme = readme.replace(regex, newList);
} else {
  readme += '\n\n' + newList;
}

fs.writeFileSync(readmePath, readme, 'utf-8');
console.log(`Tracked comment from ${username} on ${date}`);
