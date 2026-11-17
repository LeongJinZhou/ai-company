---
name: lessons
description: What the company learned across all the founder's projects - what worked, what failed, what cost too much, platform limits. Use in the Study step when a project starts, or when the task is about GitHub data, YouTube, browser voice, a new screen, or anything else named inside.
---
# Lessons (all projects)

Verified things only, three lines each at most, newest first, 60 lines at
most. When a task teaches something a later project needs, add it here.

## Product and design
- 2026-11-17, benchmark: a task with a new screen cost about 3 times a task
  without one (browser, design skill, reviewers). Plan a screen in one go, not
  one small order per tweak.
- 2026-11-16, Delta FM: features added to an old screen with no design pass
  were rejected ("all is AI") although every function worked. A feature on a
  screen is not done until the screen is good.
- 2026-11-16, Delta FM: "like a shirt shop" in the prompt was design
  direction. Treating it as sound only was a miss.

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
- 2026-11-17: a lessons file outside every project folder could not be read by
  sessions (permission refused). Company knowledge must live in a skill.
- 2026-11-17, benchmark: in a production sweep a fix changed more than its
  finding named. Fix what the finding names; a bigger change goes to the
  founder first.
- 2026-11-16: seven questions before building were rejected. Decide from the
  prompt and the project, show one plan, let the founder correct by looking.
- 2026-11-16: "it works" was reported as if it meant "it is good". Say what
  was verified and what only the founder can judge.

## This laptop (Windows)
- Git Bash turns an argument such as "/context" into a file path. Set
  `MSYS_NO_PATHCONV=1` for that command.
- The app's preview could not start `npx` itself. Start the server in the
  background and attach the preview to its URL.
