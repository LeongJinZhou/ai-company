# Lessons that come with the kit

Read together with `SKILL.md` beside this file. Every laptop has the same
lessons here, and `bash update.sh` brings new ones. Never write in this file
on a laptop that only uses the kit: own lessons go in `SKILL.md`.
Whoever releases the kit: before a release, move the lessons worth sharing
from your own `SKILL.md` into this file, in neutral words (no project or
client names, no dates).

## Product and design
- A task with a new screen cost about 3 times a task without one (browser,
  design skill, reviewers). Plan a screen in one go, not one small order per
  tweak.
- Features added to an old screen with no design pass were rejected although
  every function worked. A feature on a screen is not done until the screen
  is good.
- A comparison in the prompt ("like a shirt shop") is design direction, not
  only content.

## Platforms
- GitHub public events API: about 60 requests an hour without a token, and
  events can arrive minutes late. Polling from the browser every 60 seconds
  stops working fast. Use a webhook, or a token kept on the server. A
  `git pull` is never visible to GitHub.
- YouTube inside a page: use the IFrame player. The browser cannot read its
  sound, so meters are simulated. A crossfade needs two players. Videos with
  embedding switched off must be skipped; playlist links need their own code.
- Browser voice (Web Speech): speaks only after the user has clicked once, and
  some browsers never fire the "end" event. Always set a timeout.

## Working method
- A step an installer prints as "do this by hand" does not happen on other
  machines. Make the script do it and the check fail without it; compare a
  real machine with what the installer writes.
- After a file is untracked and git-ignored, switching to a branch that still
  tracks it replaces it without a warning. Save a copy first
  (`git hash-object -w` and a ref), restore it after.
- A lessons file outside every project folder could not be read by sessions
  (permission refused). Company knowledge must live in a skill.
- In a production sweep a fix changed more than its finding named. Fix what
  the finding names; a bigger change goes to the founder first.
- Seven questions before building were rejected. Decide from the prompt and
  the project, show one plan, let the founder correct by looking.
- "It works" was reported as if it meant "it is good". Say what was verified
  and what only the founder can judge.

## Windows
- A long-running Vite dev server can serve an old copy of an edited file.
  Before debugging a front-end failure, restart Vite and run it again.
- Git Bash turns an argument such as "/context" into a file path. Set
  `MSYS_NO_PATHCONV=1` for that command.
- The app's preview could not start `npx` itself. Start the server in the
  background and attach the preview to its URL.
