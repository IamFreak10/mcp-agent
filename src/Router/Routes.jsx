import { createBrowserRouter } from 'react-router';
import Home from '../Pages/Home/Root';
import App from '../App';
import Connector from '@/Pages/Connectors/Connector';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    children: [{ index: true, element: <App /> },{
      path: 'connectors',
      element:<Connector/>,
    }],
  },
]);
export default router;
