import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Animates the routed content on navigation. Uses useOutlet so the exiting
 * route keeps rendering its old element while the new one enters.
 */
export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
