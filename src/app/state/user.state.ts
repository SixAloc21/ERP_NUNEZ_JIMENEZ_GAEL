export interface UserState {
  name: string;
  permissions: string[];
}

export const initialUserState: UserState = {
  name: '',
  permissions: []
};