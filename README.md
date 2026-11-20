# Daniyal Murtaza — Portfolio

Work-only portfolio: interactive 3D screen header, category bar, work grid,
floating Upwork reviews and a Hire-on-Upwork finish. No email, phone or socials.

## Run it locally
    npm install
    npm run dev

## Deploy (Vercel)
Push this `code` folder to a new GitHub repo, then import it on vercel.com.
Framework: Vite. Build: `npm run build`. Output: `dist`. Nothing else to set.

## Where to change things
- Hourly rate, Upwork link, reviews: `src/data/site.js`
- Titles / client names / hide a piece: `src/data/work.json`
  (add `"hidden": true` to hide one, `"featured": true` to put it on the header screen)

## Adding new work
Drop files into the category folders of
`D:\1_Daxator Studios\website\Daxator Studio Website\work`, then run `npm run sync`
(or just ask Claude to "upload the new work to the portfolio").
