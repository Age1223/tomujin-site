# Event follow-up emails

`tools/events-followup.gs` sends emails from **admin@tomujin.edu.mn** to the people in the **Sign-ups** tab of the "TAS Master Leads 2026" sheet. The emails use the Tomujin design.

| Email | Who gets it | When |
|---|---|---|
| **Та бүртгүүллээ!** (details) | Everyone who registered for one event (Юунд = Бүртгүүлсэн) | Within 10 minutes of registering |
| **Удахгүй эхэлнэ** (reminder) | The same people, with the join link or address | 3 hours before the start |
| **Бүртгэл баталгаажлаа** (subscribed) | Everyone else who signed up to hear about events (Дараагийнхыг мэдэх, Мэдээлэл авах, Ярилцлага унших, the pop-up…) | Once, within 10 minutes. It lists the upcoming events |
| **Урилга** (invitation) | Those subscribers, for each new event on /events | Within 10 minutes of the event going live on the site (not for events starting in under 6 hours) |

Nobody gets the same email twice. Someone who already registered for an event isn't invited to it.

## Where each piece comes from

- **The event** (title, date, time, online / in-person, place, speaker, poster, description) comes from the live site's `events/data.js`. Add an event there as usual (see the comment at the top of that file) and push to `main`. The script picks it up within 10 minutes.
- **What the website shouldn't show publicly** goes in the sheet's **Event emails** tab. The script adds one row per event. Fill in:
  - **Нэгдэх холбоос (онлайн)**: the Zoom / Meet link. The reminder isn't sent until it's filled in; the **Төлөв** column warns you.
  - **Хаяг (биечлэн)** and **Газрын зургийн холбоос**: for in-person events. Without an address it uses `place` from data.js.
  - **Бэлдэх зүйлс**: one thing per line (Alt+Enter for a new line in a cell). Shown as a list.
  - **Нэмэлт мэдээлэл**: anything else, e.g. parking or which door.
  - The two checkboxes turn the emails on or off for that event: details + reminder, and invitations.
- **Email log** records every email sent. Delete a row there to send that email again.
- **Unsubscribed**: paste an email address in column A and that person gets no more invitations. The emails tell people to reply "STOP"; replies go to admin@tomujin.edu.mn.

## Setup (once, about 10 minutes)

1. Sign in to Google as **admin@tomujin.edu.mn**. It needs edit access to "TAS Master Leads 2026".
2. Open the sheet → **Extensions → Apps Script**. This opens the project that already holds `events-signups.gs` (the sign-up form).
3. Click **+** next to Files → **Script**, name it `events-followup`, delete what's in it, paste all of `tools/events-followup.gs`, and click Save.
   - This doesn't touch the sign-up form: the web app keeps running its deployed version.
   - If the project already has an `onOpen` function, rename this file's `onOpen` and call it from the existing one.
4. Reload the sheet. A menu **Эвентийн имэйл** appears (it can take a few seconds).
5. **Эвентийн имэйл → 1. Тохиргоо хийх.** Allow access when Google asks (Sheets, Gmail, and fetching tomujin.edu.mn). This creates the Event emails, Email log and Unsubscribed tabs, and tells you how many emails would go out right now.
6. Fill in the **Event emails** tab (join links, addresses, what to prepare). Untick events you don't want emails for.
7. **Туршилтын имэйлүүдийг надад илгээх** sends you all four emails, marked [ТУРШИЛТ], to check them in Gmail. Nothing is logged.
8. **Хүлээгдэж буй имэйлүүдийг одоо илгээх…** shows how many of each email would go out, and sends after you confirm. Use it the first time so you can see the numbers.
9. **Автомат илгээлтийг асаах** checks every 10 minutes from then on.

The automatic sending runs as whoever turned it on, so that has to be admin@tomujin.edu.mn. (Another account works only if admin@tomujin.edu.mn is a "Send mail as" address in its Gmail.)

## On command

- **Нэг эвентийн сануулгыг одоо илгээх…**: pick an event and send the reminder (with the link) to everyone registered, now instead of 3 hours before. People who already got it are skipped.
- **Хүлээгдэж буй имэйлүүдийг одоо илгээх…**: sends whatever is waiting without waiting for the 10-minute check.
- **Автомат илгээлтийг унтраах**: stops all automatic emails.
- **Google Form-ын бүртгэлийг оруулах…**: copies registrations from an old Google Form's responses sheet into Sign-ups for one event, so they get the same emails. It asks for the responses sheet's link, the event, and the date that event's sign-ups started (one form was reused for several talks). It uses the email typed in the form, or the Google-collected one if that isn't a valid address. People already registered for that event (same email or phone) are skipped, so running it twice adds no one twice. Their rows say "Google Form" in the Хуудас column. At the end it asks whether to keep checking that form: say yes and every 10-minute run adds new answers too (and "send now" does as well), until the event is over. **Google Form-ыг автоматаар шалгахыг зогсоох…** stops that.

## Settings

At the top of the script: `EE_REMINDER_HOURS` (3), `EE_MIN_INVITE_HOURS` (6), `EE_NEW_EVENT_AUTO` (new events start with both checkboxes ticked), `EE_MAX_PER_RUN` (80 emails per 10 minutes). A Google Workspace account can send about 1,500 emails a day.

## Things to know

- **Don't rename the Sign-ups headers** (Овог нэр, Имэйл, Юунд, Эвентийн id) or the Event emails headers. The script finds columns by name.
- **Changing an event's `id` in data.js** makes it a new event: subscribers would be invited again. Change the title or date instead.
- **An event with `tbc: true`** gets no emails until the line is removed. Then subscribers are invited.
- **The script in the sheet is the live one.** If you change `tools/events-followup.gs`, paste it into the Apps Script project again.
- **Previewing the design locally:** the email builders don't use any Google services, so they can run in Node. Load the file with `new Function(...)` and call `eeRenderDetails_`, `eeRenderSubscribed_` or `eeRenderInvitation_`.
