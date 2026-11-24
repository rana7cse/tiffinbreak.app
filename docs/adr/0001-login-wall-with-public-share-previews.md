# Login wall, except share previews

Every page (Feed, Story, School, profile) requires login, because Stories name real classmates and teachers and the community is meant to be semi-private. The one exception is the link preview: a shared Story URL serves Open Graph tags (title, cover photo, Writer's first name) to unauthenticated crawlers, while the body stays behind login. Without this, links shared on Facebook/Messenger would show a bare login page, which kills the main growth loop. This is also why the app is server-rendered.

**Temporary exception (owner decision):** Story pages (`/stories/:id`) are fully public for now, signed out too. Love, Report, Edit and Delete still need a session; hidden Stories stay 404 except for their Writer and Admins. The Feed, School and Writer pages remain behind the login wall.
