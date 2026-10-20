import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import ConfusionMatrixDisplay
import numpy as np

# Actual confusion matrix from the trained model
cm = np.array([
    [56647, 4],
    [26, 69]
])

# Plot confusion matrix
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Legitimate", "Fraud"]
)

disp.plot(cmap="Blues", values_format="d")
plt.title("Confusion Matrix - Credit Card Fraud Detection")
plt.tight_layout()

# Save image
plt.savefig("confusionmatrix.png", dpi=300, bbox_inches="tight")
plt.show()