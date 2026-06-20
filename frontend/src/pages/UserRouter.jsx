import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUsername, isAdminAuthed } from '../api/client';
import Spinner from '../components/Spinner';

export default function UserRouter() {
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = isAdminAuthed();
    const me = getUsername();

    if (isAdmin) {
      api.getUser(username)
        .then(() => navigate(`/admin/${username}/dashboard`, { replace: true }))
        .catch(() => navigate('/user-not-found', { replace: true }));
      return;
    }

    if (me === username) {
      navigate(`/${username}/dashboard`, { replace: true });
      return;
    }

    api.getUser(username)
      .then(() => navigate(`/${username}/profile`, { replace: true }))
      .catch(err => {
        if (err.status === 404) navigate('/user-not-found', { replace: true });
        else navigate('/user-not-found', { replace: true });
      });
  }, [username]);

  return <Spinner />;
}
