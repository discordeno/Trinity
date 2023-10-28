type Snowflake = string;

/**
 *  The allowed mention field allows for more granular control over mentions without various hacks to the message content.
 *  This will always validate against message content to avoid phantom pings
 *  (e.g. to ping everyone, you must still have `@everyone` in the message content),
 *  and check against user/bot permissions.
 */
export type AllowedMentions = {
    parse: AllowedMentionsType[];
    roles: Snowflake[];
    users: Snowflake[];
    repliedUser: boolean;
};

export enum AllowedMentionsType {
    RoleMentions = "roles",
    UserMentions = "users",
    EveryoneMentions = "everyone",
}
/** foo */
export type CreateMessage = {
    content?: string;
    nonce?: string;
    tts?: boolean;
    embeds?: Embed[];
    allowedMentions?: AllowedMentions;
    // messageReference?: MessageReference
    // components?: Components[]
    stickerIds?: Snowflake[] | undefined;
    files?: FileContent[];
    // attachments?: Attachment[]
    flags?: number;
};

export type Embed = {
    author?: EmbedAuthor;
    color?: number;
    description?: string;
    fields?: EmbedField[];
    footer?: EmbedFooter;
    image?: EmbedImage;
    provider?: EmbedProvider;
    thumbnail?: EmbedThumbnail;
    timestamp?: string;
    title?: string;
    type?: EmbedType;
    url?: string;
    video?: EmbedVideo;
};

export type EmbedAuthor = {
    name: string;
    /** Only supports `https`. */
    url?: string;
    /** Only supports `https` and attachments. */
    iconUrl?: string;
    proxyIconUrl?: string;
};

export type EmbedField = {
    text: string;
    iconUrl?: string;
    /** Only supports `https` and attachments. */
    proxyIconUrl?: string;
};

export type EmbedFooter = {
    text: string;
    iconUrl?: string;
    /** Only supports `https` and attachments. */
    proxyIconUrl?: string;
};

export type EmbedImage = {
    /** Only supports `https` and attachments. */
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
};

export type EmbedProvider = {
    name?: string;
    url?: string;
};

export type EmbedThumbnail = {
    /** Only supports `https` and attachments. */
    url: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
};

export enum EmbedType {
    Article = "article",
    Gifv = "gifv",
    Image = "image",
    Link = "link",
    Rich = "rich",
    Video = "video",
}

export type EmbedVideo = {
    url?: string;
    proxyUrl?: string;
    height?: number;
    width?: number;
};

export type FileContent = {
    blob: Blob;
    name: string;
};
