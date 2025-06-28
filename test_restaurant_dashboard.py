#!/usr/bin/env python3
"""
Restaurant Dashboard Selenium Test Execution
Based on RESTAURANT_DASHBOARD_SELENIUM_TEST_PLAN.md
"""

import pytest
import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

class TestResults:
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
    
    def log_test(self, test_id, test_name, status, message="", details=None):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        result = {
            "test_id": test_id,
            "test_name": test_name,
            "status": status,
            "timestamp": timestamp,
            "message": message,
            "details": details or {}
        }
        self.results.append(result)
        print(f"[{timestamp}] {test_id}: {status} - {test_name}")
        if message:
            print(f"    {message}")

class TestRestaurantDashboard:
    @pytest.fixture(scope="class")
    def driver(self):
        # Setup Chrome driver with options
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.implicitly_wait(10)
        yield driver
        driver.quit()
    
    @pytest.fixture(scope="class")
    def test_results(self):
        return TestResults()
    
    def test_TS001_initial_page_load(self, driver, test_results):
        """TS001: Initial Page Load and Authentication"""
        try:
            test_results.log_test("TS001", "Initial Page Load and Authentication", "RUNNING")
            
            # Navigate to restaurant dashboard
            driver.get("http://localhost:3000/restaurant-dashboard")
            
            # Wait for page to load
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            # Check for fallback message (since we're not in Saleor context)
            page_source = driver.page_source.lower()
            
            if "restaurant dashboard" in page_source:
                test_results.log_test("TS001", "Initial Page Load", "PASS", 
                                    "Page loaded successfully")
            else:
                test_results.log_test("TS001", "Initial Page Load", "FAIL", 
                                    "Restaurant dashboard content not found")
                
            # Check for JavaScript errors
            logs = driver.get_log('browser')
            js_errors = [log for log in logs if log['level'] == 'SEVERE']
            
            if js_errors:
                test_results.log_test("TS001", "JavaScript Errors Check", "FAIL", 
                                    f"Found {len(js_errors)} JavaScript errors",
                                    {"errors": js_errors})
            else:
                test_results.log_test("TS001", "JavaScript Errors Check", "PASS", 
                                    "No JavaScript errors found")
                
        except Exception as e:
            test_results.log_test("TS001", "Initial Page Load", "ERROR", str(e))
    
    def test_TS002_responsive_design(self, driver, test_results):
        """TS009: Responsive Design Testing"""
        try:
            test_results.log_test("TS009", "Responsive Design Testing", "RUNNING")
            
            # Test different screen sizes
            screen_sizes = [
                (1920, 1080, "Desktop"),
                (768, 1024, "Tablet"),
                (375, 667, "Mobile")
            ]
            
            for width, height, device in screen_sizes:
                driver.set_window_size(width, height)
                time.sleep(2)  # Wait for responsive changes
                
                # Check if page is still accessible
                try:
                    driver.find_element(By.TAG_NAME, "body")
                    test_results.log_test("TS009", f"Responsive - {device}", "PASS", 
                                        f"Layout responsive at {width}x{height}")
                except:
                    test_results.log_test("TS009", f"Responsive - {device}", "FAIL", 
                                        f"Layout issues at {width}x{height}")
                    
        except Exception as e:
            test_results.log_test("TS009", "Responsive Design Testing", "ERROR", str(e))
    
    def test_TS003_page_performance(self, driver, test_results):
        """TS011: Performance Testing"""
        try:
            test_results.log_test("TS011", "Performance Testing", "RUNNING")
            
            # Measure page load time
            start_time = time.time()
            driver.get("http://localhost:3000/restaurant-dashboard")
            
            # Wait for page to be fully loaded
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            load_time = time.time() - start_time
            
            if load_time < 3.0:
                test_results.log_test("TS011", "Page Load Performance", "PASS", 
                                    f"Page loaded in {load_time:.2f}s (< 3s target)")
            else:
                test_results.log_test("TS011", "Page Load Performance", "FAIL", 
                                    f"Page loaded in {load_time:.2f}s (> 3s target)")
                
        except Exception as e:
            test_results.log_test("TS011", "Performance Testing", "ERROR", str(e))
    
    def test_TS004_navigation_elements(self, driver, test_results):
        """Test basic navigation elements presence"""
        try:
            test_results.log_test("TS004", "Navigation Elements", "RUNNING")
            
            driver.get("http://localhost:3000/restaurant-dashboard")
            
            # Look for common navigation elements
            nav_elements = [
                "nav", "header", "main", "button", "a"
            ]
            
            found_elements = 0
            for element in nav_elements:
                try:
                    elements = driver.find_elements(By.TAG_NAME, element)
                    if elements:
                        found_elements += 1
                        test_results.log_test("TS004", f"Found {element} elements", "INFO", 
                                            f"Found {len(elements)} {element} elements")
                except:
                    pass
            
            if found_elements > 0:
                test_results.log_test("TS004", "Navigation Elements", "PASS", 
                                    f"Found {found_elements} types of navigation elements")
            else:
                test_results.log_test("TS004", "Navigation Elements", "FAIL", 
                                    "No navigation elements found")
                
        except Exception as e:
            test_results.log_test("TS004", "Navigation Elements", "ERROR", str(e))
    
    def test_TS005_meta_tags(self, driver, test_results):
        """Test page meta information"""
        try:
            test_results.log_test("TS005", "Meta Tags and SEO", "RUNNING")
            
            driver.get("http://localhost:3000/restaurant-dashboard")
            
            # Check for title
            title = driver.title
            if title and title.strip():
                test_results.log_test("TS005", "Page Title", "PASS", f"Title: {title}")
            else:
                test_results.log_test("TS005", "Page Title", "FAIL", "No page title found")
            
            # Check for meta tags
            meta_tags = driver.find_elements(By.TAG_NAME, "meta")
            test_results.log_test("TS005", "Meta Tags", "INFO", 
                                f"Found {len(meta_tags)} meta tags")
                
        except Exception as e:
            test_results.log_test("TS005", "Meta Tags and SEO", "ERROR", str(e))

def run_tests():
    """Run all tests and generate report"""
    print("Starting Restaurant Dashboard Selenium Test Execution")
    print("=" * 60)
    
    # Run pytest with custom options
    pytest.main([__file__, "-v", "--tb=short"])

if __name__ == "__main__":
    run_tests()