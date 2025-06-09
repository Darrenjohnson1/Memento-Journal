import { Button } from "./ui/button";

function UserAccount({ user }: any) {
  return (
    <Button variant="outline" className="h-10 w-10 rounded-full">
      {user?.email.charAt(0).toUpperCase()}
    </Button>
  );
}

export default UserAccount;
