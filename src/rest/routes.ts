export const createRoutes = () => ({
    users: {
        me: `/users/@me`,
    },
    channels: {
        createMessage: (channelId: string) => `/channels/${channelId}/messages`,
    },
});

// export const createRoutes: () => Routes = () => structuredClone(routes);

export type Routes = ReturnType<typeof createRoutes>;
