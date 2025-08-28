import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => (
  <main className="w-full flex justify-center p-20">
    <UserProfile />
  </main>
);

export default UserProfilePage;
