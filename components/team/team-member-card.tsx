import { Mail, Globe, ExternalLink } from "lucide-react"
import type { TeamMember } from "@/lib/team"

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="border border-border bg-card p-6 hover:border-primary transition-colors">
      {/* Avatar */}
      {member.avatar_url && (
        <img
          src={member.avatar_url}
          alt={member.display_name}
          className="mb-4 h-24 w-24 rounded border border-border object-cover"
        />
      )}

      {/* Name and title */}
      <h3 className="stencil text-lg text-foreground">{member.display_name}</h3>
      {member.title && (
        <p className="label-mono mt-1 text-sm text-primary">{member.title}</p>
      )}

      {/* Bio */}
      {member.bio && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {member.bio}
        </p>
      )}

      {/* Social links */}
      <div className="mt-4 flex gap-2">
        {member.website_url && (
          <a
            href={member.website_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Website"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="h-4 w-4" />
          </a>
        )}
        {(member.twitter_url || member.truth_social_url || member.youtube_url) && (
          <a
            href={member.twitter_url || member.truth_social_url || member.youtube_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title={member.twitter_url ? "Twitter/X" : member.truth_social_url ? "Truth Social" : "YouTube"}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {member.show_email_publicly && member.public_email && (
          <a
            href={`mailto:${member.public_email}`}
            title="Email"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  )
}
