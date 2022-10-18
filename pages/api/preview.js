// import { getStaticRoute, getDynamicRoute } from '@lib/routes'

// export default function handler(req, res) {
//   // Bail if no secret or slug defined
//   if (req.query.token !== 'HULL' || !req.query.type) {
//     return res.status(401).json({ message: 'Invalid preview request' })
//   }

//   // determine if it's a dynamic route
//   const isStatic = getStaticRoute(req.query.type)
//   const isDynamic = getDynamicRoute(req.query.type)

//   // Enable Preview Mode by setting the cookies and passing the sanity token for fetching
//   res.setPreviewData(
//     { token: process.env.SANITY_API_TOKEN },
//     {
//       maxAge: 20,
//     }
//   )

//   // Redirect to the associated page
//   res.redirect(
//     isStatic
//       ? `/${isStatic}`
//       : `/${isDynamic ? `${isDynamic}/` : ''}${req.query.slug}`
//   )
// }





import { postBySlugQuery } from '../../lib/queries'
import { previewClient } from '../../lib/sanity.server'

function redirectToPreview(res, Location) {
  // Enable Preview Mode by setting the cookies
  res.setPreviewData({})
  // Redirect to a preview capable route
  res.writeHead(307, { Location })
  res.end()
}

export default async function preview(req, res) {
  const secret = process.env.SANITY_STUDIO_PREVIEW_SECRET
  // Only require a secret when in production
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new TypeError(`Missing SANITY_STUDIO_PREVIEW_SECRET`)
  }
  // Check the secret if it's provided, enables running preview mode locally before the env var is setup
  if (secret && req.query.secret !== secret) {
    return res.status(401).json({ message: 'Invalid secret' })
  }
  // If no slug is provided open preview mode on the frontpage
  if (!req.query.slug) {
    return redirectToPreview(res, '/')
  }

  // Check if the post with the given `slug` exists
  const post = await previewClient.fetch(postBySlugQuery, {
    slug: req.query.slug,
  })

  // If the slug doesn't exist prevent preview mode from being enabled
  if (!post) {
    return res.status(401).json({ message: 'Invalid slug' })
  }

  // Redirect to the path from the fetched post
  // We don't redirect to req.query.slug as that might lead to open redirect vulnerabilities
  redirectToPreview(res, `/posts/${post.slug}`)
}
