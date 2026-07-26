import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"

export const metadata: Metadata = {
  title: "New to Q? | HOT AND FRESH",
  description: "Everything you need to know to get started with Qnotables.",
}

export default function NewToQPage() {
  return (
    <>
      <SiteHeader />
      <TopAd />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      {/* Page header */}
      <div className="mb-12 border-b border-border pb-8">
        <p className="label-mono mb-3 text-primary">Q - THE PLAN TO SAVE THE WORLD</p>
        <h1 className="stencil text-4xl text-foreground md:text-5xl">New to Q?</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
Q is a United States Military Intelligence Operation. You may have heard it referred to as a psyop. It is.  A plan to awaken the citizens of the United States and by proxy, the World. The goal is to expose the evil and corruption that have been in positions of power for decades and even centuries WW (world wide), and return the power back to "We the People".

Q is a back channel from the government to the people. It is a bypass of the corrupt and infiltrated media propaganda machines. President Trump refers to it as "Fake News" for a reason, most of it is. They are the "Enemy of the people". They have the ability and know how to fabricate news stories to fit a desired narrative. Have you ever seen the movie "Wag the Dog" or "The Manchurian Candidate". They are not so far off from the truth.

The media machine continues to attack our movement.

You awake is their greatest fear. </p>
      </div>

      {/* Content sections — add, edit, or remove these freely */}
      <div className="space-y-12">

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">What is Qnotables?</h2>
          <p className="leading-relaxed text-muted-foreground">
      The first post was made in October 2017 and subsequent posts went viral. Those posts were the declaration of war on the DS (Deep State), see the Q post link in the menu. It's a great place to become familiar with if your new.

Nearly 5 thousand Q posts, millions of anon posts, and research from anons all across the world, have been scraped and archived at Qresear.ch. 'Archiveanon' automatically scrapes and archives millions of posts to make it all searchable however I always tried, like Steve Bannon emphasized, to be the signal not the noise.

This isn't a political party movement, this is the Revolution. "The Great Awakening"

You may not see it just yet, but if you hang around long enough you will.

You awake is their greatest fear.
 

The Republican/Democrat dichotomy will quickly transform into the true dichotomy of Good vs Evil. Patriots vs Traitors. This movement is World Wide.
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Where to Start</h2>
          <p className="leading-relaxed text-muted-foreground">
            The world we have known is not how it seems.

    Corrupt Politicians

    Secret Societies

    Treason

    Drug and Human Trafficking

    Elite level pedophiles

    Blackmail

    Brainwashing

    False Flag Attacks

    Satanic ceremonies

    Intel Leaks.

Anons (Anonymous Patriots) work together to uncover data on targets, and expose them to the public. Q just helps us focus our research. There are many types of anons. Bakers help setup the board or thread on /qresearch/ and collect notable research and up to the minute news. Anons find information and share with the /qresearch/ board. We dig through public records looking for suspicious ties and relationships to questionable people, monetary transactions and policy decisions etc. We flag public communications, and decipher Q's posts. Some of us make memes and others clip important sections from news feeds and rallys to share.

 

There are many content creators (YouTube, Twitter, Instagram, Bloggers, etc.) Some of who choose to not be so anonymous. Discernment will be your friend. Many theories are presented within our community, it is important that you do your own research to find "THE" truth. There are many out there that still have an agenda. There are many out there that have publicly attempted to discredit this movement that will then try to piggy back off of it. Be careful who you follow. Shills will be a thing until we are able to expose each and everyone of them.


CONTROLLED OPPOSITION

Infiltration and Subversion

This is not a Game
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Key Resources</h2>
          <p className="leading-relaxed text-muted-foreground">
            Satanism on full display at the Gotthard Tunnel Opening Ceremony in Switzerland. Angela Merkle in attendance with other world leaders and Heads of State. If they behave this way in the open, imagine what they do in private. Those who know can't sleep. This was the video that made everything click for me. It was my "Red Pill". Originally linked to RT's youtube video. RT has been banned from youtube. I archived the full 6 hour upload because you don't get to put evidence like this out obscurely, no one acknowledge it then pretended it doesn't exist.

https://www.bitchute.com/video/us5xnNenaKtO/
          </p>
        </section>

        <section>
          <h2 className="stencil mb-4 text-2xl text-foreground">Symbolism Will Be Their Downfall</h2>
          <p className="leading-relaxed text-muted-foreground">
           This website is merely a starting point, a place to help you build your own foundation in truth. Notables do not necessarily equal endorsement. Fair warning, the rabbit hole is deep. You will hear and see many theories. I have attempted to wrap my mind around the logic behind most of them and many of the theories do in fact hold quite a bit of water. I am not here to tell you what to think or how to feel. That is up to you. I am here to help point you in the right direction, by exposing what they routinely hide and distort from the general public.

You should make an attempt to learn how to use some of the tools linked on this website. My only desire is to awaken you enough that you start to see through the lies for yourself, and hopefully learn how to be more effective at redpilling others. Subscribe to the mailing list at the bottom to get updates about this site and possible future projects I have in the works..
ephesians 6.12.jpg

The choice to know will be yours.

The truth will set you free.



DARK ► LIGHT

WWG1WGA

(Where We Go One We Go All)

While you are here have a look around. I set this site up to help show you the path forward.



Learn to trust yourself!
          </p>
        </section>

      </div>
      </main>
      <BottomAd />
      <SiteFooter />
    </>
  )
}
