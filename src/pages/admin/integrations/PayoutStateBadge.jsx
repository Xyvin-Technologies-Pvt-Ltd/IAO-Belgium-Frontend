import { STATE_STYLES } from "./payoutUi";

/** Payout state chip (Ready / Match by hand / Waiting for session day / Action needed). */
const PayoutStateBadge = ({ state, p }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STATE_STYLES[state] || STATE_STYLES.empty
      }`}
    >
      {p(`state.${state}`)}
    </span>
  );
};

export default PayoutStateBadge;
