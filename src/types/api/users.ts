export type UserRole = "NORMAL_USER" | "CONTRIBUTOR" | "MODERATOR" | "ADMIN";

export type ProfileUser = {
  id: string;
  name: string;
  school: string | null;
  role: UserRole;
};

export type CurrentUserResponse = {
  user: ProfileUser;
};
