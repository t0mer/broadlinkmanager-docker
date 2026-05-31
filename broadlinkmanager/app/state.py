# Mutable RF sweep state — shared between /rf/learn, /rf/status, /rf/continue
_continue_to_sweep: bool = False
_rf_sweep_message: str = ""
_rf_sweep_status: bool = False


def reset_rf_state() -> None:
    global _continue_to_sweep, _rf_sweep_message, _rf_sweep_status
    _continue_to_sweep = False
    _rf_sweep_message = ""
    _rf_sweep_status = False


def set_rf_message(msg: str) -> None:
    global _rf_sweep_message
    _rf_sweep_message = msg


def set_rf_status(status: bool) -> None:
    global _rf_sweep_status
    _rf_sweep_status = status


def set_continue_sweep(value: bool) -> None:
    global _continue_to_sweep
    _continue_to_sweep = value


def get_rf_state() -> dict:
    return {
        "_continu_to_sweep": str(_continue_to_sweep),  # key kept for API compat
        "_rf_sweep_message": _rf_sweep_message,
        "_rf_sweep_status": str(_rf_sweep_status),
    }
