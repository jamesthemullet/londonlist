type DbLike = {
  db: {
    query: (uid: string) => {
      findMany: (params: { where: Record<string, unknown> }) => Promise<Array<{ id: number; username: string }>>;
    };
  };
};

export async function findUserByUsername(
  strapi: DbLike,
  username: string,
): Promise<{ id: number; username: string } | undefined> {
  const [user] = await strapi.db
    .query('plugin::users-permissions.user')
    .findMany({ where: { username } });
  return user;
}
