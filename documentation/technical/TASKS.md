# TASKS.md

## Meetings Insights (connected to Supabase documents table, document chunks, and document metadata)
- [ ] The titles are wrong in Supabase this should have the naming convention "Meeting title - date"
- [ ] All fireflies transcripts need to be synced. There are only around 150.
- [ ] Missing columns for summary, fireflies id, firflies url.
- [ ] Chat is not returning a response
- [ ] Display insights associated with each project on the individual project pages
- [ ] Add the ability for users to add notes on a prject page that are caved and can be
- [ ] There are no insights shown on the page
- [ ] Insights and meetings should be linked to a project
- [ ] Display insights associated with each project on the individual project pages
- [ ] Add the ability for users to add notes on a prject page that are caved and can be viewed later. These also should be vectorized and added to the insights if applicable.
- [ ] Add participants to meetings-db table
- [ ] Backfill columns for participants, summary, tasks, sentiment score, ect. 
- [ ] The meetings should link to the md file in Supabase storage so the transcript can be viewed. Add search capability in the transcripts.
- [ ] Allow projects to be edited on the meetings table


## Tasks Table
- [ ] Create tasks from meeting transcripts that are assigned to employees


## ASRS Features
- [ ] Add frontend file upload to be vectorize


## Projects Dashboard
- [x] Make each card clickable and link to the project detail page
- [x] Add table view option
- [ ] Ensure all tables can be edited
- [ ] Only show current projects


Can cloudflare host the transcripts and link to them in the supabase table?
Leadership daily review sent in teams morning and evening

## Future things to Streamline/Automate
- Contracts
- Schedules
- Project Reports
- Credit card transactions coding


Ability for leadership to be able to tag meetings as sales, training, good example, issue, ect.

Meetings - show vector status and insights generated.

Meeting sidebar when clicked:
1. All metadata (name, id, date, time, participants, url, duration)
2. Summary
3. Action items
4. Insights
5. Transcript
6. Links to download transcrpt and link to fireflies url