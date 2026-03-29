import { useNavigate } from "react-router-dom";

const BackButton = ({
    to,
    onClick,
    label = "Back",
    className = ""
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        if (to) {
            navigate(to);
            return;
        }

        navigate(-1);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`}
        >
            <span aria-hidden="true">←</span>
            <span>{label}</span>
        </button>
    );
};

export default BackButton;
